import { useState } from 'react';
export default function TestBoton() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>Clicks: {count}</button>;
}
