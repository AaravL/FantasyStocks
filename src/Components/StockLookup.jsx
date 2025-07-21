import { useState } from 'react';


const StockLookup = () => {

  const [symbol, setSymbol] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => { 

    setError(null);
    setResult(null);

    e.preventDefault();

    try { 
        const res = await fetch(`http://localhost:8000/price?ticker=${symbol}`);
        const data = await res.json();

        if (!res.ok) { 
            setError(data.detail || "Stock data not found.");
        } else { 
            setResult(data);
        }

        console.log(data);
    } catch (err) { 
        setError("Failed to fetch stock price");
    }
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

      {error && <p className="text-red-600">{error}</p>}
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