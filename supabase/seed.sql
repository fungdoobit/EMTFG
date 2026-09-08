-- Finance Department Process Hub — seed data
--
-- Real content from the EMT Finance Playbook (T12W and PHE sub-departments),
-- not placeholder data. Run once after schema.sql, against a fresh/empty
-- database — it does not check for existing rows, so re-running it will
-- duplicate everything. If you need to start over, truncate first:
--
--   truncate departments, sub_departments, sub_department_contacts,
--     processes, process_steps, process_attachments, hacks, glossary_terms
--     restart identity cascade;
--
-- Uses a single PL/pgSQL block with local variables (v_process_id, etc.) so
-- each process's steps and hacks can be inserted right after the process
-- itself, keyed off the id Postgres just generated — no manual UUIDs to
-- keep in sync by hand.

do $$
declare
  dept_id uuid;
  t12w_id uuid;
  phe_id uuid;
  pid uuid; -- reused for whichever process we're currently inserting
begin

  -- ── Department ───────────────────────────────────────────────────────
  insert into departments (slug, name, notes) values (
    'finance', 'Finance',
    'Much of this content is adapted from the Finance Playbook originally compiled by Jia Qian and Vincent — credit to them for the groundwork this section is built on.'
  )
  returning id into dept_id;

  -- ── Other departments (empty for now — add sub-departments to get started) ──
  insert into departments (slug, name) values
    ('business-development', 'Business Development'),
    ('customs-brokerage', 'Customs Brokerage'),
    ('trucking-and-haulage-transportation', 'Trucking and Haulage (Transportation)'),
    ('warehousing', 'Warehousing');

  -- ── Sub-department: T12W ────────────────────────────────────────────
  insert into sub_departments (department_id, slug, name, tools_systems, general_note)
  values (
    dept_id, 't12w', 'T12W',
    array['Excel', 'Sovy', 'Pelkon III'],
    'Most T12W processes rely heavily on computer-based systems (Excel, Sovy, Pelkon III) with little integration between them, so any technical disruption halts invoice processing, payment, and billing — and manual re-entry across systems raises error risk generally.'
  )
  returning id into t12w_id;

  insert into sub_department_contacts (sub_department_id, name, handles, sort_order) values
    (t12w_id, 'Hanis', 'Penang Port invoices, Maersk local charges, ACELOGY (outsourced transport), cheque voucher', 1),
    (t12w_id, 'Sharifah', 'POPC payment, non-trade AR billing, contract worker, credit note requisition, warehouse revenue report', 2),
    (t12w_id, 'Ms Ho', 'Petty cash flow, job entry listing closing, FA depreciation, warehouse sales/loss report', 3),
    (t12w_id, 'Azeila', 'A-Sonic, Mogilan, ZMF (sea shipment), MPH, Moorea (air shipment), payment voucher, offset payment, SOA generation', 4),
    (t12w_id, 'Shihan', 'AMBALATHA (outsourced transport), bank reconciliation, Hapag-Lloyd local charges, DGC, VBS invoices', 5);

  -- 1. Penang Port Daily Invoices
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (t12w_id, dept_id, 'penang-port-daily-invoices', 'Penang Port Daily Invoices', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Check non-billed invoices',
    'Check daily invoice (PELKON III)',
    'Print and record invoices in Excel',
    'Identify job no. and complete details',
    'Create vendor invoice in Sovy',
    'Scan and upload to Sovy',
    'Update Weekly AGING',
    'Submit to Dr. Khana for signature',
    'Pass to Hanis'
  ]) with ordinality as t(s, ord);
  insert into hacks (process_id, title, description, created_by) values
    (pid, 'Sovy filename standard', 'Use a consistent naming convention when uploading to Sovy — Job Number + Vendor Name, e.g. PDIM2605008-PP — so documents are easy to identify and track.', 'Seed import'),
    (pid, 'Upload-status tracker', 'Some containers don''t have supporting invoices uploaded yet when you go to search for them in Sovy, causing repeated searches. Keep a shared reference sheet showing invoice upload status per container so you can prioritize ready cases and set pending ones aside.', 'Seed import');

  -- 2. Outsource Transport (ACELOGY-VAT)
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (t12w_id, dept_id, 'outsource-transport-acelogy-vat', 'Outsource Transport (ACELOGY-VAT)', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Check both DO and Invoice',
    'Record the prices quoted by PKT',
    'Calculate total amount',
    'Scan the documents'
  ]) with ordinality as t(s, ord);

  -- 3. Maersk Local Charges
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (t12w_id, dept_id, 'maersk-local-charges', 'Maersk Local Charges', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Ensure both Maersk and PKT invoice amounts tally',
    'Complete required details on Maersk invoice',
    'Check vendor invoice no. and ensure amount tally',
    'Key in details in Excel'
  ]) with ordinality as t(s, ord);

  -- 4. Courier
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (t12w_id, dept_id, 'courier', 'Courier', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Key in invoices in Excel',
    'Collect flyer bag & courier slip from front desk',
    'Fill in slip',
    'Put all invoices into flyer bag'
  ]) with ordinality as t(s, ord);

  -- 5. Cheque Voucher
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (t12w_id, dept_id, 'cheque-voucher', 'Cheque Voucher', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Ensure amounts on PR, vendor invoice, and PKT invoice are correct and consistent',
    'Check details on both invoices',
    'Write job number and invoice number on vendor invoice',
    'Record cheque details (number, date, amount) on vendor invoice',
    'Retrieve and print forwarding invoice from Sovy',
    'Scan and upload documents'
  ]) with ordinality as t(s, ord);

  -- 6. POPC Payment
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (t12w_id, dept_id, 'popc-payment', 'POPC Payment', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Check invoice, DO, PO & PR',
    'Stamp received date',
    'Check details',
    'Record in Excel',
    'Enter AP/Vendor invoice (define by whether need to bill other party)',
    'Create CB payment only when there are SOA',
    'Make payment',
    'Scan and upload to Sovy',
    'Update bank ref. at cheque no. column in payment voucher',
    'Pass to Ms. Ho'
  ]) with ordinality as t(s, ord);
  insert into hacks (process_id, title, description, created_by) values
    (pid, 'Automate with an ERP (e.g. Acumatica)', 'This is a high-volume process affecting vendor relationships, cash flow, and audit compliance. An ERP system could automatically fetch and match data from invoices, DOs, PRs, and POs once received, then auto-update the tracking Excel — cutting manual document checking and data entry.', 'Seed import');

  -- 7. Non-trade AR Billing
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (t12w_id, dept_id, 'non-trade-ar-billing', 'Non-trade AR Billing', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Enter Excel',
    'Create AR invoice',
    'Download AR invoice and compile with supporting invoice as PDF',
    'Send to Ms. Ho for verification',
    'Upload e-invoice after verified (within 24 hours)'
  ]) with ordinality as t(s, ord);

  -- 8. Contract Worker
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (t12w_id, dept_id, 'contract-worker', 'Contract Worker', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Check Sovy (AP) for previous month''s payment',
    'Record payment amount in Excel with PBPI no.',
    'Refer invoice amount for payment if not recorded in Sovy'
  ]) with ordinality as t(s, ord);

  -- 9. Credit Note Requisition
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (t12w_id, dept_id, 'credit-note-requisition', 'Credit Note Requisition', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Check sufficient supporting evidence for credit amount',
    'Send documents to HQ via courier',
    'Create credit note only after approval received from HQ'
  ]) with ordinality as t(s, ord);

  -- 10. Warehouse Revenue Report (OAH/KLH)
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (t12w_id, dept_id, 'warehouse-revenue-report', 'Warehouse Revenue Report (OAH/KLH)', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Generate invoice listing from Sovy',
    'Create pivot table to arrange required data',
    'Separate data into revenue breakdown and summary',
    'Include accrued income amount if available',
    'Confirm total monthly revenue for each warehouse'
  ]) with ordinality as t(s, ord);

  -- 11. Petty Cash Flow (with job no.)
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (t12w_id, dept_id, 'petty-cash-flow-with-job-no', 'Petty Cash Flow (with job no.)', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Key in received claim form in Excel',
    'Create new payment entry in cost sheet',
    'Prepare payment request (need to print invoice for custom duty)'
  ]) with ordinality as t(s, ord);

  -- 12. Petty Cash Flow (without job no.)
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (t12w_id, dept_id, 'petty-cash-flow-without-job-no', 'Petty Cash Flow (without job no.)', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Key in received claim form in Excel',
    'Create one PBPV for all claim forms without job no. in Sovy – CB payment'
  ]) with ordinality as t(s, ord);

  -- 13. Job Entry Listing Closing
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (t12w_id, dept_id, 'job-entry-listing-closing', 'Job Entry Listing Closing', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Review all job no. for closing month',
    'Identify relevant job no.',
    'Record in Excel (actual sales but no actual cost / actual cost exceeds actual sales)',
    'Send to Ms. Ho to verify'
  ]) with ordinality as t(s, ord);

  -- 14. FA Depreciation
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (t12w_id, dept_id, 'fa-depreciation', 'FA Depreciation', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Create independent worksheet for each asset category',
    'Calculate monthly depreciation separately for The 12 Waves, Kulim Logistics Hub & Admin',
    'Compare depreciation amounts of previous two months'
  ]) with ordinality as t(s, ord);
  insert into hacks (process_id, title, description, created_by) values
    (pid, 'Automate with a fixed-asset module (e.g. SQL Accounting System)', 'Record fixed assets by asset group with predefined useful life and residual value, and let the system auto-generate monthly depreciation schedules and journal vouchers — reducing manual calculation and minimizing the risk of formula errors.', 'Seed import');

  -- 15. Warehouse Sales/Loss Report
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (t12w_id, dept_id, 'warehouse-sales-loss-report', 'Warehouse Sales/Loss Report', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Received data from HQ Finance',
    'Enter data into Excel and generate pivot table',
    'Arrange data to prepare Warehouse Sales/Loss report'
  ]) with ordinality as t(s, ord);

  -- 16. Mogilan Transport Charges
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (t12w_id, dept_id, 'mogilan-transport-charges', 'Mogilan Transport Charges', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Print related job no. invoice and packing document',
    'Fill in details on Mogilan invoice based on PKT quote pricing',
    'Fill in truck plate, driver, dimensions in DO',
    'Key in Excel',
    'Create vendor invoice in Sovy',
    'Scan and upload to Sovy'
  ]) with ordinality as t(s, ord);
  insert into hacks (process_id, title, description, created_by) values
    (pid, 'Sequential stamping', 'Stamp invoices the exact moment after printing, before recording in Excel (Print → Check → Stamp → Excel Entry). Prevents accidentally skipping or double-recording an invoice.', 'Seed import');

  -- 17. Payment Voucher
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (t12w_id, dept_id, 'payment-voucher', 'Payment Voucher', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Open Excel to check job no.',
    'Print custom duty invoice, receipt, bank slips',
    'Create CB payment request',
    'Save and print payment voucher',
    'Scan and submit to Dr. Khana for signature'
  ]) with ordinality as t(s, ord);

  -- 18. Offset Payment
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (t12w_id, dept_id, 'offset-payment', 'Offset Payment', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Check the bank slip details',
    'Create a CB receipt in Sovy',
    'Save the record',
    'Upload the details to Excel'
  ]) with ordinality as t(s, ord);

  -- 19. Generate SOA
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (t12w_id, dept_id, 'generate-soa', 'Generate SOA', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Open Report Explorer in Sovy',
    'Open AR statement.rpt',
    'Enter customer code and date',
    'Tick "Show Outstanding Only"'
  ]) with ordinality as t(s, ord);

  -- 20. Outsource Transport (AMBALATHA Dexcom)
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (t12w_id, dept_id, 'outsource-transport-ambalatha-dexcom', 'Outsource Transport (AMBALATHA Dexcom)', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Check both DO and PKT listing for consistency',
    'Verify quoted price correct',
    'Fill in details on Ambalatha invoice based on PKT quote pricing',
    'Create vendor invoice in Sovy',
    'Record in Excel',
    'Scan and upload to OneDrive'
  ]) with ordinality as t(s, ord);

  -- 21. Hapag-Lloyd Local Charges
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (t12w_id, dept_id, 'hapag-lloyd-local-charges', 'Hapag-Lloyd Local Charges', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Ensure amounts on Hapag-Lloyd and PKT invoices tally',
    'Complete required details on Hapag-Lloyd invoice',
    'Create vendor invoice',
    'Key in details in Excel'
  ]) with ordinality as t(s, ord);

  -- 22. CB Bank Reconciliation
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (t12w_id, dept_id, 'cb-bank-reconciliation', 'CB Bank Reconciliation', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Match CB bank reconciliation transactions with corresponding Excel records for AMB, RHB, HLB',
    'Ensure bank statement balance agrees with reconciled amount',
    'Save and upload to OneDrive'
  ]) with ordinality as t(s, ord);
  insert into hacks (process_id, title, description, created_by) values
    (pid, 'Automate matching', 'Import bank statement files directly into the system and auto-match transactions by amount and reference (e.g. OR numbers) — improves efficiency and reduces manual effort.', 'Seed import'),
    (pid, 'Troubleshooting checklist for mismatches', 'When documents can''t be found or figures don''t tally: (1) check for typing errors in document numbers, (2) verify whether the same transaction appears in multiple locations, (3) search using the Vendor Invoice (INV) number instead of the payment voucher, (4) treat the payment voucher only as confirmation payment was completed, not as your primary search key.', 'Seed import');

  -- 23. DGC
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (t12w_id, dept_id, 'dgc', 'DGC', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Verify invoice against container listing for consistency',
    'Create vendor invoice in Sovy',
    'Record details in Excel'
  ]) with ordinality as t(s, ord);

  -- 24. VBS Booking
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (t12w_id, dept_id, 'vbs-booking', 'VBS Booking', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Check Penang Port VBS listing',
    'Create vendor invoice in Sovy'
  ]) with ordinality as t(s, ord);

  -- ── Sub-department: PHE ──────────────────────────────────────────────
  insert into sub_departments (department_id, slug, name, tools_systems, general_note)
  values (
    dept_id, 'phe', 'PHE',
    array['Autocount', 'Excel', 'SharePoint', 'Outlook', 'OneDrive'],
    'Across PHE, having multiple disconnected tools/systems for almost every process leads to repeated manual data entry, which increases both processing time and the risk of inconsistency/errors.'
  )
  returning id into phe_id;

  insert into sub_department_contacts (sub_department_id, name, handles, sort_order) values
    (phe_id, 'Jingjing', 'TSC & PSR related issues', 1);

  -- 1. AR Invoices Entry
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (phe_id, dept_id, 'ar-invoices-entry', 'AR Invoices Entry', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Create AR invoices in Autocount for TSC and PSR',
    'Submit and save',
    'Upload invoices to SharePoint'
  ]) with ordinality as t(s, ord);
  insert into hacks (process_id, title, description, created_by) values
    (pid, 'Self-service invoicing (proposed)', 'Enable a self-service member portal where members download their own PDF invoices, with e-invoicing generated automatically post-payment — saves finance/front-desk from manually sending them and keeps all records under the member''s account for easy audit tracing.', 'Seed import');

  -- 2. Official Receipt (OR)
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (phe_id, dept_id, 'official-receipt', 'Official Receipt (OR)', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Check debtor payment slips and bank statements for tally',
    'Create OR in Autocount and knock off related invoice',
    'Save and merge with debtor payment slips',
    'Upload to SharePoint',
    'Update OR number in Excel'
  ]) with ordinality as t(s, ord);

  -- 3. AP Invoices Entry
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (phe_id, dept_id, 'ap-invoices-entry', 'AP Invoices Entry', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Ensure invoice signed by PIC',
    'Create AP invoice in Autocount',
    'Save and record PI number on vendor invoice'
  ]) with ordinality as t(s, ord);

  -- 4. Payment Voucher (PSR deposit refund)
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (phe_id, dept_id, 'payment-voucher-psr-deposit-refund', 'Payment Voucher (PSR deposit refund)', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Check refund form to ensure student name and bank account holder match',
    'Create payment voucher in Autocount',
    'Enter student details in bank file'
  ]) with ordinality as t(s, ord);

  -- 5. SOA
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (phe_id, dept_id, 'soa', 'SOA', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Access debtor statement report in A/R module',
    'Enter relevant debtor',
    'Define date range and generate statement'
  ]) with ordinality as t(s, ord);

  -- 6. Knock-off Payment (offset overpayment)
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (phe_id, dept_id, 'knock-off-payment', 'Knock-off Payment (offset overpayment)', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Identify the OR related to debtor''s overpayment',
    'Offset overpayment against new invoice',
    'Save transaction and generate SOA for reference'
  ]) with ordinality as t(s, ord);

  -- 7. Petty Cash
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (phe_id, dept_id, 'petty-cash', 'Petty Cash', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Ensure requestor has supporting documents (toll claims need HR signature)',
    'Enter details into petty cash Excel file',
    'Create AP invoice in Autocount'
  ]) with ordinality as t(s, ord);

  -- 8. Payment Voucher (full process)
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (phe_id, dept_id, 'payment-voucher-full-process', 'Payment Voucher (full process)', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Create PV in Autocount only when all supporting documents complete',
    'Enter details into Excel (PV and cheque status)',
    'Enter cheque number into Autocount after payment made',
    'Scan and upload creditor invoice to SharePoint',
    'Merge PV, bank slips, creditor invoice as one set',
    'Upload to SharePoint for e-sign approval',
    'Inform Elaine for signature',
    'Create PV listing for approval by DAL and DSMT',
    'Attach approved PV with bank slips showing successful HQ transaction',
    'Upload final documents to SharePoint'
  ]) with ordinality as t(s, ord);
  insert into hacks (process_id, title, description, created_by) values
    (pid, 'Automate with an ERP (e.g. Acumatica)', 'Integrate document management and approval within one platform — supporting documents link directly to the transaction, approvals go through digital authorisation, and status is tracked in real time instead of manual Excel follow-ups.', 'Seed import');

  -- 9. PSR Laundry Report
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (phe_id, dept_id, 'psr-laundry-report', 'PSR Laundry Report', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Export sales report from MyPayment gateway website',
    'Prepare monthly laundry report using sales data',
    'Refer to bank statement from SharePoint to verify actual amount received',
    'Investigate unusually high service charges via RevenueMonster website refunds',
    'Create sales invoice in Autocount',
    'Save as draft (submit at month end)'
  ]) with ordinality as t(s, ord);

  -- 10. Credit Note (CN)
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (phe_id, dept_id, 'credit-note', 'Credit Note (CN)', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Check whether debtor has outstanding invoice (create one first if not)',
    'Create sales CN',
    'Issue AR credit note and knock off amount',
    'Generate SOA for debtor as reference'
  ]) with ordinality as t(s, ord);

  -- 11. Prepayment Invoice
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (phe_id, dept_id, 'prepayment-invoice', 'Prepayment Invoice', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Record details in Accrual & Prepayment Excel file',
    'Create AP invoice with two separate entries',
    'Allocate payment for upcoming month to prepayment account code',
    'Open PV and record details in PV Excel file'
  ]) with ordinality as t(s, ord);

  -- 12. Journal Voucher (month-end closing)
  insert into processes (sub_department_id, department_id, slug, title, notes, created_by)
  values (phe_id, dept_id, 'journal-voucher', 'Journal Voucher', 'Month-end closing process.', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Post journal vouchers for depreciation, accrual expenses, sales',
    'Post reclassification journals for incorrect account code entries from previous month',
    'Ensure all journal amounts tally with Excel data'
  ]) with ordinality as t(s, ord);

  -- 13. Ledger Report (month-end closing)
  insert into processes (sub_department_id, department_id, slug, title, notes, created_by)
  values (phe_id, dept_id, 'ledger-report', 'Ledger Report', 'Month-end closing process.', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Review and ensure all invoices, JV, CN recorded under correct account codes',
    'Ensure final balances in contra/temporary account codes are zero',
    'Export accrued income and deposit payable reports from ledger',
    'Ensure total debit and credit amounts balanced'
  ]) with ordinality as t(s, ord);

  -- 14. SST Processor (bi-monthly)
  insert into processes (sub_department_id, department_id, slug, title, notes, created_by)
  values (phe_id, dept_id, 'sst-processor', 'SST Processor', 'Bi-monthly process.', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Check SST processor in Autocount for correct tax amount',
    'Refer to MyTax website to verify actual payable amount',
    'Create PV based on amount recorded in Autocount',
    'Record rounding adjustments if variance between MyTax and Autocount'
  ]) with ordinality as t(s, ord);

  -- 15. Profit & Loss (P&L) Report
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (phe_id, dept_id, 'profit-and-loss-report', 'Profit & Loss (P&L) Report', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Generate P&L statement from Autocount',
    'Compare sales and costs between two months',
    'Investigate variances and identify reasons',
    'Record findings in report'
  ]) with ordinality as t(s, ord);

  -- 16. Bank Reconciliation
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (phe_id, dept_id, 'bank-reconciliation', 'Bank Reconciliation', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Compare actual bank statement with bank statement in Autocount',
    'Tick and verify OR number and amount match',
    'Ensure final balance is zero after reconciling all transactions'
  ]) with ordinality as t(s, ord);
  insert into hacks (process_id, title, description, created_by) values
    (pid, 'GYM payment reconciliation integration (proposed)', 'GYM payments are currently reconciled by manually cross-checking payment screenshots against the bank statement, which gets slower and riskier as sales volume grows. Since GYM''s site is built in-house by the TSC IT team, this reconciliation could plug directly into the finance workflow — pushing payment data straight in and cutting out manual screenshot-matching.', 'Seed import'),
    (pid, 'Automated GYM checkout flow (proposed)', 'Retail/on-site revenue (e.g. protein bars, drinks) is currently logged manually through a backend form (amount, date, method, reference), risking human error and reconciliation delays. A QR-code/web checkout flow (browse → guest or member checkout → pay via FPX/card/e-wallet) would eliminate manual entry, generate automatic receipts, and post accurate sales records straight into the finance system.', 'Seed import');

  -- 17. Monthly Report
  insert into processes (sub_department_id, department_id, slug, title, created_by)
  values (phe_id, dept_id, 'monthly-report', 'Monthly Report', 'Seed import')
  returning id into pid;
  insert into process_steps (process_id, step_order, title)
  select pid, ord, s from unnest(array[
    'Extract monthly data from SharePoint Excel (FA depreciation, accrued income, deposit payable)',
    'Extract monthly data from Autocount (AR & AP aging, bank reconciliation, P/L statement, balance sheet analysis)',
    'Apply relevant formulas',
    'Ensure all variance amounts are zero',
    'Compare actual costs vs previous month',
    'Compare actual costs vs budget plan'
  ]) with ordinality as t(s, ord);
  insert into hacks (process_id, title, description, created_by) values
    (pid, 'Automate with BI tooling (e.g. Power BI)', 'Integrate data directly from Autocount and SharePoint so it auto-consolidates, applies calculations, and generates real-time dashboards for variance analysis — cutting manual data extraction and formula work in Excel, freeing time for actual analysis.', 'Seed import');

  -- ── Glossary (cross-department, not tied to a sub-department) ────────
  insert into glossary_terms (abbreviation, full_term, meaning, sort_order) values
    ('AP', 'Account Payable', 'Manages payments owed to suppliers.', 1),
    ('AR', 'Account Receivable', 'Money owed to a business by its customers.', 2),
    ('SOA', 'Statement of Account', 'Summary document listing invoices and payment status.', 3),
    ('DO', 'Delivery Order', 'Proof of delivery between designated parties.', 4),
    ('PO', 'Purchase Order', 'Document authorizing purchase of goods/services.', 5),
    ('PR', 'Purchase Requisition', 'Internal document requesting approval to purchase.', 6),
    ('POPC', 'Purchase Order Processing Centre', 'Centralized unit managing PO-based payments.', 7),
    ('CB', 'Cash Book', 'Payment recorded in cash book, via cash or bank.', 8),
    ('DGC', 'Depot Gate Charges', 'Charges for handling/lifting/documenting containers at depot.', 9),
    ('FA', 'Fixed Asset', 'Resources expected to realize long-term economic benefit (12+ months).', 10),
    ('VBS', 'Vehicle Booking System', 'System for terminal operators to arrange truck arrival/movement.', 11),
    ('OR', 'Official Receipt', 'Formal pre-numbered proof-of-payment document.', 12),
    ('PI', 'Payable Invoice', 'Invoice a company bills a customer for goods/services.', 13),
    ('CN', 'Credit Note', 'Document reducing/cancelling amount previously owed.', 14),
    ('P&L', 'Profit and Loss', 'Statement of revenues, costs, expenses over a period.', 15),
    ('JV', 'Journal Voucher', 'Accounting record for non-cash transactions/corrections.', 16),
    ('DR', 'Debit', 'Entry reducing liabilities or increasing assets.', 17),
    ('CR', 'Credit', 'Entry increasing liabilities or reducing assets.', 18),
    ('G/L', 'General Ledger', 'Record of all assets, liabilities, expenses, income, equity.', 19),
    ('POB', 'Payment on Behalf', 'One party pays a supplier for another party''s expense.', 20),
    ('ROB', 'Receive on Behalf', 'Accepting payment as representative for another party.', 21),
    ('AC', 'Actual Cost', 'Real historical expenditure for a product/service/project.', 22),
    ('BP', 'Budget Plan', 'Structured projection of revenue, costs, investments over time.', 23),
    ('BS', 'Balance Sheet', 'Statement of a company''s assets/liabilities at a point in time.', 24);

end $$;
