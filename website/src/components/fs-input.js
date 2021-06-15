import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';


import styles from './fs-input.module.css';

Input.propTypes = {
  multiline: PropTypes.bool,
  highlight: PropTypes.bool,
  large: PropTypes.bool,
};

export default function Input({ multiline, highlight, large, className, ...props }) {
  let Component = multiline ? 'textarea' : 'input';
  let largeStyles = large ? styles['fs-text-field--input__large'] : '';

  return (
    <>
    {!highlight ?
      <Component className={clsx('fs-text-field', styles['fs-text-field--input'], largeStyles, className)} {...props} />
    :
      <div className={clsx('fs-text-field', styles['input-boder__highlight'])}>
        <Component className={clsx(styles['fs-text-field--input'], styles['fs-text-field--input__highlight'], largeStyles)} {...props} />
      </div>
    }
   </>
  );
}
