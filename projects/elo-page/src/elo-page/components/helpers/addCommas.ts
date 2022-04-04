export default function addCommas(xStr: string) {
  const [digits, decimals = ''] = xStr.split('.');

  let result = '';

  for (let i = 0; i < digits.length; i++) {
    if (i % 3 === 0 && i !== 0) {
      result = ',' + result;
    }

    result = digits[digits.length - i - 1] + result;
  }

  if (decimals.length > 0) {
    result += `.${decimals}`;
  }

  return result;
}
