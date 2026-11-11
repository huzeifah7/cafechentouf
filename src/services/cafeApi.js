import { supabase } from '../supabaseClient';

export function getLocalDateStr(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLocalMonthStr(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Helper to parse metadata stored in description or columns
function parseTransactionRow(row) {
  let type = 'expense';
  let shift = '1';
  let server_name = 'ياسين';
  let note = row.description || '';

  if (row.description && typeof row.description === 'string' && row.description.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(row.description);
      if (parsed.type) type = parsed.type;
      if (parsed.shift) shift = String(parsed.shift);
      if (parsed.server) server_name = parsed.server;
      if (parsed.note !== undefined) note = parsed.note;
    } catch {
      // Fallback to plain description
    }
  }

  // If table later has explicit columns, prefer them
  if (row.type) type = row.type;
  if (row.shift) shift = String(row.shift);
  if (row.server_name) server_name = row.server_name;

  let resolvedDate = row.date;
  if (!resolvedDate && row.created_at) {
    const createdDate = new Date(row.created_at);
    resolvedDate = Number.isNaN(createdDate.getTime())
      ? row.created_at.split('T')[0]
      : getLocalDateStr(createdDate);
  }
  if (!resolvedDate) {
    resolvedDate = getLocalDateStr();
  }

  return {
    id: row.id,
    title: row.title || 'بدون عنوان',
    amount: Number(row.amount || 0),
    date: resolvedDate,
    type, // 'expense' | 'income'
    shift, // '1' (صباح) | '2' (ليل)
    server_name, // 'ياسين' | 'مختار'
    note,
    created_at: row.created_at,
  };
}

export const cafeApi = {
  // 1. GET ALL TRANSACTIONS (EXPENSES & INCOMES)
  async getTransactions() {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      return { data: [], error };
    }

    const transactions = (data || []).map(parseTransactionRow);
    return { data: transactions, error: null };
  },

  // 2. ADD TRANSACTION (EXPENSE OR INCOME)
  async addTransaction({ type = 'expense', title, amount, date, shift = '1', server_name = 'ياسين', description = '' }) {
    const today = getLocalDateStr();
    const cleanDate = date || today;

    // Encode metadata in description JSON so it works on any table schema
    const metadataStr = JSON.stringify({
      type,
      shift: String(shift || '1'),
      server: server_name || 'ياسين',
      note: description || '',
    });

    const payload = {
      title: title.trim(),
      amount: Number(amount),
      date: cleanDate,
      description: metadataStr,
    };

    const { data, error } = await supabase
      .from('expenses')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error inserting transaction:', error);
      return { data: null, error };
    }

    return { data: parseTransactionRow(data), error: null };
  },

  // 3. UPDATE TRANSACTION (FOR EDIT PERMISSION)
  async updateTransaction(id, { type = 'expense', title, amount, date, shift = '1', server_name = 'ياسين', description = '' }) {
    const today = getLocalDateStr();
    const cleanDate = date || today;

    const metadataStr = JSON.stringify({
      type,
      shift: String(shift || '1'),
      server: server_name || 'ياسين',
      note: description || '',
    });

    const payload = {
      title: title.trim(),
      amount: Number(amount),
      date: cleanDate,
      description: metadataStr,
    };

    const { data, error } = await supabase
      .from('expenses')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating transaction:', error);
      return { data: null, error };
    }

    return { data: parseTransactionRow(data), error: null };
  },

  // 4. DELETE TRANSACTION
  async deleteTransaction(id) {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    return { error };
  },

  // 4. DAILY JOURNAL & MONTHLY BILAN
  async getDailyJournal(selectedMonth) {
    const { data: transactions, error } = await this.getTransactions();

    if (error) {
      return { days: [], monthSummary: { total_madakhil: 0, total_massarif: 0, total_arba7: 0, days_count: 0 }, error };
    }

    // Determine current month if not passed (Format: YYYY-MM)
    const currentMonthStr = selectedMonth || getLocalMonthStr();

    // Group transactions by date
    const groupedByDate = {};

    transactions.forEach((tx) => {
      const d = tx.date;
      if (!groupedByDate[d]) {
        groupedByDate[d] = {
          date: d,
          // Shift 1 (الوردية 1 - الصباح)
          shift1: {
            madakhil: 0,
            massarif: 0,
            arba7: 0,
            items: [],
          },
          // Shift 2 (الوردية 2 - الليل)
          shift2: {
            madakhil: 0,
            massarif: 0,
            arba7: 0,
            items: [],
          },
          total_madakhil: 0,
          total_massarif: 0,
          total_arba7: 0,
          all_items: [],
        };
      }

      groupedByDate[d].all_items.push(tx);

      if (tx.shift === '2') {
        groupedByDate[d].shift2.items.push(tx);
        if (tx.type === 'income') {
          groupedByDate[d].shift2.madakhil += tx.amount;
        } else {
          groupedByDate[d].shift2.massarif += tx.amount;
        }
      } else {
        // Shift 1
        groupedByDate[d].shift1.items.push(tx);
        if (tx.type === 'income') {
          groupedByDate[d].shift1.madakhil += tx.amount;
        } else {
          groupedByDate[d].shift1.massarif += tx.amount;
        }
      }
    });

    // Calculate totals per day:
    // Arba7 Shift 1 = Madakhil Shift 1 - Massarif Shift 1
    // Arba7 Shift 2 = Madakhil Shift 2 - Massarif Shift 2
    // Total Arba7 = Arba7 Shift 1 + Arba7 Shift 2
    const allDays = Object.values(groupedByDate).map((day) => {
      day.shift1.arba7 = day.shift1.madakhil - day.shift1.massarif;
      day.shift2.arba7 = day.shift2.madakhil - day.shift2.massarif;

      day.total_madakhil = day.shift1.madakhil + day.shift2.madakhil;
      day.total_massarif = day.shift1.massarif + day.shift2.massarif;
      day.total_arba7 = day.shift1.arba7 + day.shift2.arba7; // Arba7 shift 1 + Arba7 shift 2

      return day;
    });

    // Sort days descending by date
    allDays.sort((a, b) => (a.date < b.date ? 1 : -1));

    // Filter days for the selected month
    const filteredDays = allDays.filter((d) => d.date.startsWith(currentMonthStr));

    // Calculate monthly summary
    const monthSummary = filteredDays.reduce(
      (acc, d) => {
        acc.total_madakhil += d.total_madakhil;
        acc.total_massarif += d.total_massarif;
        acc.total_arba7 += d.total_arba7;
        acc.days_count += 1;
        return acc;
      },
      { total_madakhil: 0, total_massarif: 0, total_arba7: 0, days_count: 0 }
    );

    return {
      days: filteredDays,
      allDays,
      monthSummary,
      selectedMonth: currentMonthStr,
      error: null,
    };
  },
};
