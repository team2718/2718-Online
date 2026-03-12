/** RMSE of the ePOP model vs. actual alliance score (points). */
export const EPOP_RMSE = 65;

/**
 * Standard normal CDF using the Abramowitz & Stegun approximation.
 * Maximum error < 1.5e-7.
 */
export function normCDF(x: number): number {
	const sign = x >= 0 ? 1 : -1;
	const t = 1 / (1 + 0.3275911 * Math.abs(x));
	const poly =
		t *
		(0.254829592 +
			t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
	const erf = sign * (1 - poly * Math.exp(-x * x));
	return 0.5 * (1 + erf);
}

/**
 * Probability that `myAllianceEpop` beats `theirAllianceEpop`.
 * Each alliance score is modelled as N(epopSum, EPOP_RMSE²), independent,
 * so the difference has σ = EPOP_RMSE * √2.
 */
export function winProbability(myAllianceEpop: number, theirAllianceEpop: number): number {
	return normCDF((myAllianceEpop - theirAllianceEpop) / (EPOP_RMSE * Math.SQRT2));
}
