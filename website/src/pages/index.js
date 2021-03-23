import React from 'react';
import { Redirect } from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';

function DocsRedirect() {
  return <Redirect to={useBaseUrl('/docs')} />;
}

export default DocsRedirect;
