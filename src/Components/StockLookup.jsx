import { useState } from 'react';

const StockLookup = () => {

  const [symbol, setSymbol] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => { 
    e.preventDefault();
    const res = await fetch(`http://localhost:8000/price?ticker=${symbol}`);
    const data = await res.json();
    console.log(data);
    setResult(data);
  }


  return (
    <div>
      <h1>Stock Price Lookup</h1>
      <form onSubmit={handleSubmit}>
        <input value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder='Enter stock symbol'
        />
        <button type="submit">Submit</button>
      </form>

      {result?.price_data && (
        <div>
          <p>Price: {result.price_data.vwap}</p>
          <p>Timestamp: {result.price_data.timestamp}</p>
        </div>
      )}
    </div>
  )
}

export default StockLookup