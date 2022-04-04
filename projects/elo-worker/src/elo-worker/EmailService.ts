import { createTransport as createNodemailerTransport } from 'nodemailer';
import delay from '../common-pure/delay';
import never from '../common-pure/never';
import Database from '../database/Database';
import { isUnsubscribedEmail } from '../database/queries/unsubscribedEmails';

import AppComponents from './AppComponents';
import { OutgoingEmailType } from './Config';
import UnsubscribeCode from './UnsubscribeCode';

export type Email = {
  recipient: string,
  title: string,
  body: string,
};

type HtmlEmail = {
  recipient: string,
  title: string,
  html: string,
};

export default class EmailService {
  private transports: Record<OutgoingEmailType, (email: HtmlEmail) => Promise<void>>;
  private db: Database;
  private unsubscribeUrl: string;
  private unsubscribeSecret: string;
  private sendEmailTime = 7000;

  constructor({ config, db }: AppComponents<'config' | 'db'>) {
    this.transports = {} as any;
    this.db = db;
    this.unsubscribeUrl = config.unsubscribeUrl;
    this.unsubscribeSecret = config.secrets.emailUnsubscribeCodes;

    for (const [k, emailConfig] of Object.entries(config.outgoingEmail)) {
      const key = k as OutgoingEmailType;

      if (emailConfig.type === 'console') {
        this.transports[key] = async (email) => {
          console.log('console email', email);
        };
      } else if (emailConfig.type === 'nodemailer') {
        const nmTransport = createNodemailerTransport(emailConfig.config);

        this.transports[key] = async (email) => {
          const before = Date.now();
          const info = await nmTransport.sendMail({
            from: emailConfig.config.auth.user,
            to: email.recipient,
            subject: email.title,
            html: email.html,
          });
          const duration = Date.now() - before;
          this.sendEmailTime = 0.9 * this.sendEmailTime + 0.1 * duration;

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
      const fakeDelayTime = Math.round(
        this.sendEmailTime - 50 + 100 * Math.random(),
      );

      console.warn(
        'Refusing to send email to',
        email.recipient,
        'because they have unsubscribed',
        { fakeDelayTime },
      );

      // Sending an email is a slow api (about 7 seconds). When a user has
      // unsubscribed, it's relatively instant for us to look that up in the
      // database. This may be overkill, but in principle we need this
      // artificial delay to pretend that we're busy sending the email, so that
      // people can't (easily) figure out whether other people have
      // unsubscribed.
      await delay(fakeDelayTime);

      return;
    }

    const fullUnsubscribeUrl = new URL(this.unsubscribeUrl);

    fullUnsubscribeUrl.searchParams.set('email', email.recipient);

    fullUnsubscribeUrl.searchParams.set(
      'code',
      UnsubscribeCode(this.unsubscribeSecret, email.recipient),
    );

    await this.transports[type]({
      recipient: email.recipient,
      title: email.title,
      html: [
        `<pre style="font-family: sans-serif;">${email.body}</pre>`,
        '<br>',
        `<a href="${fullUnsubscribeUrl.toString()}">Unsubscribe</a>`,
      ].join('\n'),
    });
  }
}
