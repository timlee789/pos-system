import { useCallback } from 'react';
import { sendPrintJob, sendOpenDrawer } from '../services/printerApi';
import { PrintJob } from '../types';

export const usePrinter = () => {
  const printReceipt = useCallback(async (job: PrintJob) => {
    console.log("🖨️ Printing Receipt...", job);
    const result = await sendPrintJob({ ...job, type: 'RECEIPT' });
    
    if (!result.success) {
      alert("Printer Error: Check server connection!");
    }
    return result;
  }, []);

  const printKitchen = useCallback(async (job: PrintJob) => {
    console.log("👨‍🍳 Sending to Kitchen...", job);
    return await sendPrintJob({ ...job, type: 'KITCHEN' });
  }, []);

  const openDrawer = useCallback(async () => {
    console.log("📂 Opening Cash Drawer...");
    return await sendOpenDrawer();
  }, []);

  return { printReceipt, printKitchen, openDrawer };
};