// 金種指定支払の試算。窓口での現金両替には使わない。
const STANDARD_DENOMINATIONS = [10000, 5000, 1000, 500, 100, 50, 10, 5, 1];

export function estimateUnspecifiedCount(amount) {
  if (!Number.isSafeInteger(amount) || amount < 0) return null;
  let remainder = amount;
  let count = 0;
  for (const value of STANDARD_DENOMINATIONS) {
    count += Math.floor(remainder / value);
    remainder %= value;
  }
  return count;
}

export function getHandlingCount(method, specifiedCount, tenThousandCount, baselineCount) {
  if (!Number.isSafeInteger(specifiedCount) || specifiedCount < 0) return null;
  if (method === 'excludeTenThousand') {
    if (!Number.isSafeInteger(tenThousandCount) || tenThousandCount < 0 || tenThousandCount > specifiedCount) return null;
    return specifiedCount - tenThousandCount;
  }
  if (method === 'difference') {
    if (!Number.isSafeInteger(baselineCount) || baselineCount < 0 || baselineCount > specifiedCount) return null;
    return specifiedCount - baselineCount;
  }
  return null;
}
