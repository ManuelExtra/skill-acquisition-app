import { generate } from 'randomstring';
import { ICourse } from './dto/create-order.dto';

/**
 * Generate order number
 * @returns
 */
export const generateOrderNumber = (): string => {
  return `GI-C-${generate({
    length: 32,
    charset: 'alphanumeric',
    capitalization: 'uppercase',
  })}`;
};

/**
 * Function to check if price sum is the same with order price sum
 * @param courses
 * @param total
 * @returns
 */
export const isPriceSumSameWithOrderPriceSum = (
  priceSum: number,
  courses: ICourse[],
): boolean => {
  let sum = 0;
  for (let index = 0; index < courses.length; index++) {
    const course = courses[index];
    sum += course.price;
  }

  return computeAmountWithTaxRate(priceSum) === computeAmountWithTaxRate(sum);
};

/**
 * Function to check if order price is the same with total
 * @param priceSum
 * @param total
 * @returns
 */
export const isPriceSumSameWithTotalSupplied = (
  priceSum: number,
  total: number,
): boolean => {
  return computeAmountWithTaxRate(priceSum) === total;
};

/**
 * Tax rate
 */
export const TAXRATE = 5;

/**
 * Compute amount with tax rate
 * @param amount
 * @returns
 */
export const computeAmountWithTaxRate = (amount: number) => {
  return +(amount + (amount * TAXRATE) / 100).toFixed(2);
};

/**
 * Get course progress in percentage
 * @param reads
 * @param totalContent
 * @returns
 */
export const courseProgress = (reads: number, totalContent: number) => {
  const percent = Math.round((+reads / +totalContent) * 100);
  return isNaN(percent) ? 0 : percent;
};
