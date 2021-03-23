import React from 'react';
import PropTypes from 'prop-types';
import Link from '@docusaurus/Link';
import clsx from 'clsx';

import styles from './fs-button.module.css';

Button.propTypes = {
  to: PropTypes.string,
  highlight: PropTypes.bool,
  large: PropTypes.bool
};

export default function Button({ className, highlight, large, ...props }) {
  let Component = props.to ? Link : 'button';

  return <Component className={clsx('fs-button', styles['fs-button'], (highlight ? styles['fs-button__highlight'] : ''), (large ? styles['fs-button__large'] : ''), className)} {...props} />;
}
