export const toRadians = (degrees: number) => degrees * (Math.PI / 180);
export const toDegrees = (radians: number) => radians * (180 / Math.PI);

export const factorial = (n: number): number => {
  if (n < 0 || n !== Math.floor(n)) {
    throw new Error('Factorial is only defined for non-negative integers.');
  }
  if (n === 0 || n === 1) return 1;
  if (n > 170) { // JavaScript numbers lose precision for n! > 170
    console.warn("Factorial of numbers greater than 170 may result in Infinity or lose precision.");
  }
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
};