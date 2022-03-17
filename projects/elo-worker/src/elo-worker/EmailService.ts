import { createTransport as createNodemailerTransport } from 'nodemailer';
import never from '../common-pure/never';
import Database from '../database/Database';
import { isUnsubscribedEmail } from '../database/queries/unsubscribedEmails';

import AppComponents from './AppComponents';
import { OutgoingEmailType } from './Config';

export type Email = {
  recipient: string,
  title: string,
  body: string,
};

export default class EmailService {
  private transports: Record<OutgoingEmailType, (email: Email) => Promise<void>>;
  private db: Database;

  constructor({ config, db }: AppComponents<'config' | 'db'>) {
    this.transports = {} as any;
    this.db = db;

    for (const [k, emailConfig] of Object.entries(config.outgoingEmail)) {
      const key = k as OutgoingEmailType;

      if (emailConfig.type === 'console') {
        this.transports[key] = async (email) => {
          console.log('console email', email);
        };
      } else if (emailConfig.type === 'nodemailer') {
        const nmTransport = createNodemailerTransport(emailConfig.config);

        this.transports[key] = async (email) => {
          const info = await nmTransport.sendMail({
            from: emailConfig.config.auth.user,
            to: email.recipient,
            subject: email.title,
            text: email.body,
          });

          console.log('sent nodemailer email', info);
        };
      } else {
        never(emailConfig);
      }
    }
  }

  async send(type: OutgoingEmailType, email: Email) {
    const isUnsubscribed = await isUnsubscribedEmail(this.db, email.recipient);

    if (isUnsubscribed) {
      console.warn(
        'Refusing to send email to',
        email.recipient,
        'because they have unsubscribed',
      );
    }

    await this.transports[type](email);
  }
}
