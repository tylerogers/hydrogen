import {useEffect} from 'react';

export default function DelayIframe({delay}) {
  useEffect(() => {
    setTimeout(() => {
      document.querySelector('iframe').src =
        '/products/mail-it-in-freestyle-snowboard';
    }, delay);
  });

  return (
    <iframe
      style={{
        width: '100%',
        height: '300px',
      }}
    />
  );
}
