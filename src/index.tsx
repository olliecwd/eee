import React from 'react';
import { render } from 'react-dom';

import { run } from './zero-copy';

const Index: React.FC = () => {
  const clickCallback = () => {
    run();
  };

  return (
    <button type="button" onClick={clickCallback}>
      test
    </button>
  );
};

render(<Index />, document.getElementById('root'));
