/**
 * Formats a number as money with Spanish locale:
 * - Thousands separator: dot  (1.240)
 * - Decimal separator:   comma (1.234,34)
 * - No trailing zeros    (1.240 not 1.240,00)
 */
export function formatMoney(value) {
  return Number(value).toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}
