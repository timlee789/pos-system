import { PrintJob } from '../types';

const PRINTER_SERVER_URL = "http://localhost:4000";

export const sendPrintJob = async (job: PrintJob) => {
  try {
    const res = await fetch(`${PRINTER_SERVER_URL}/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job),
    });
    return await res.json();
  } catch (error) {
    console.error("Printer connection failed:", error);
    return { success: false, error: "Printer server offline" };
  }
};

export const sendOpenDrawer = async () => {
  try {
    await fetch(`${PRINTER_SERVER_URL}/open-drawer`, { method: 'POST' });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Drawer connection failed" };
  }
};