export default async function sendEmail(
  recipient: string,
  title: string,
  body: unknown,
) {
  console.log('sendEmail stub', { recipient, title, body });
}
