import { useState } from "react";
import TickRangeChart from "../components/liquidity/TickRangeChart";

const DEMO_BINS = Array.from({ length: 20 }, (_, i) => ({
  tick: i - 10,
  liquidity: Math.round(50 + 50 * Math.sin(i / 2))
}));

export default function LiquidityPage() {
  const [lower, setLower] = useState(-4);
  const [upper, setUpper] = useState(4);

  return (
    <div className="max-w-lg mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Liquidity</h2>
      <TickRangeChart bins={DEMO_BINS} lower={lower} upper={upper} />
      <div className="flex gap-4 mt-4">
        <label>
          Lower
          <input id="liquidity-lower-tick" name="lowerTick" type="number" value={lower} onChange={(e) => setLower(Number(e.target.value))} />
        </label>
        <label>
          Upper
          <input id="liquidity-upper-tick" name="upperTick" type="number" value={upper} onChange={(e) => setUpper(Number(e.target.value))} />
        </label>
      </div>
    </div>
  );
}
