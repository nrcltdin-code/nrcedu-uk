// Run by a Railway cron service once a day. It calls the site's daily job and exits, which is
// what Railway expects from a cron service. Needs APP_URL and CRON_SECRET (same values as the site).

const url = `${process.env.APP_URL?.replace(/\/+$/, "")}/api/cron/reminders`;
const response = await fetch(url, { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } });
const body = await response.text();
console.log(`${response.status} ${body}`);
if (!response.ok) process.exit(1);
