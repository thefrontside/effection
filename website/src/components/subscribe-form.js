import React, { useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import Input from './fs-input';
import Button from './fs-button';
import { validate } from 'email-validator';
import jsonp from 'jsonp';

import styles from './subscribe-form.module.css';


const MAILCHIMPURL = 'https://bigtestjs.us4.list-manage.com/subscribe/post?u=dbd3b1801544458c2dc306723&amp;id=10a2fa1562';
const TIMEOUT = 3500;

const subscribeEmailToMailchimp = ({ url, timeout }) =>
  new Promise((resolve, reject) =>
    jsonp(url, { param: 'c', timeout }, (err, data) => {
      if (err) reject(err);
      if (data) resolve(data);
    }),
  );

const addToMailchimp = function addToMailchimp(email) {
  let isEmailValid = validate(email);
  let emailEncoded = encodeURIComponent(email);
  if (!isEmailValid) {
    return Promise.resolve({
      result: 'error',
      msg: 'The email you entered is not valid.',
    });
  }

  let endpoint = MAILCHIMPURL;
  let timeout = TIMEOUT;

  // Generates MC endpoint for our jsonp request. We have to
  // change `/post` to `/post-json` otherwise, MC returns an error
  endpoint = endpoint.replace(/\/post/g, '/post-json');
  let queryParams = `&EMAIL=${emailEncoded}`;
  let url = `${endpoint}${queryParams}`;

  return subscribeEmailToMailchimp({ url, timeout });
};

SubscribeForm.propTypes = {
  highlight: PropTypes.bool,
  embedded: PropTypes.bool
};

export default function SubscribeForm({ highlight, embedded }) {
  let [email, setEmail] = useState('');
  let [status, setStatus] = useState('');

  let handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    try {
      await addToMailchimp(email, {}, MAILCHIMPURL);
      setStatus('sent');
    } catch (e) {
      setStatus('error');
    }
  }

  return (
    <form className={clsx(styles['subscribe-form'], ( embedded ? styles['subscribe-form__embedded'] : ''))} onSubmit={handleSubmit}>
      <h2 className={clsx(styles['subscribe-form--title'], (highlight ? styles['subscribe-form--title__highlight'] : ''))}>Join our <br /> newsletter</h2>
      <div className={clsx(styles['subscribe-form--inputs'], (status === 'sent' ? styles['subscribe-form--inputs__sent'] : ''))}>
        <p className={styles['subscribe-form--intro']}>
          Get a monthly update on BigTest's developments! We'll let you know about new features and learning resources.
        </p>
        {status === 'sent' ?
          <>
            <p className={styles['subscribe-form--thanks']}>
              <strong>Thanks for joining us!</strong><br /> We also hang out in a <a href="https://discord.gg/r6AvtnU" target="_blank" rel="noopener noreferrer">Discord server</a> if you wanna say hi.
            </p>
          </>
          :
          <>
            <Input
              placeholder="Your email"
              type="email"
              onChange={e => setEmail(e.target.value)}
              defaultValue={email}
              highlight={highlight}
              large={true}
              required={true}
            />
            <Button
              type="submit"
              highlight={highlight}
              large={true}
              disabled={status === 'sending'}
            >
              {status === 'sending' ? 'Sending...' : 'Sign up!'}
            </Button>
            {status === 'error' ? <p className="subscribe-form--error">There was an error submitting the form. Please try again, or <a href="/contact">contact us</a>.</p> : <></>}
          </>}
      </div>
    </form>
  );
}
