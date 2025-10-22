// src/utils/insurance.ts or src/lib/payroll/insurance-utils.ts

import { InsurancePremium, InsuranceReliefInput } from '@/types'

/**
 * Convert database InsurancePremium array to InsuranceReliefInput for tax calculations
 * This aggregates all active insurance premiums into the format expected by PAYE calculation
 */
export function convertInsurancePremiumsToReliefInput(
  premiums: InsurancePremium[] | undefined
): InsuranceReliefInput | undefined {
  if (!premiums || premiums.length === 0) {
    return undefined
  }

  // Filter active premiums only
  const activePremiums = premiums.filter(p => p.isActive !== false)
  
  if (activePremiums.length === 0) {
    return undefined
  }

  // Aggregate premiums by type
  const reliefInput: InsuranceReliefInput = {
    lifeInsurance: 0,
    educationPolicy: 0,
    healthInsurance: 0
  }

  activePremiums.forEach(premium => {
    const monthlyAmount = premium.monthlyPremium || premium.employeeShare || 0
    
    switch (premium.insuranceType?.toLowerCase()) {
      case 'life':
      case 'life insurance':
        reliefInput.lifeInsurance! += monthlyAmount
        break
      case 'education':
      case 'education policy':
        reliefInput.educationPolicy! += monthlyAmount
        break
      case 'health':
      case 'health insurance':
      case 'medical':
        reliefInput.healthInsurance! += monthlyAmount
        break
      default:
        // If type is unknown, treat as health insurance
        reliefInput.healthInsurance! += monthlyAmount
    }
  })

  // Return undefined if all values are 0
  if (
    reliefInput.lifeInsurance === 0 &&
    reliefInput.educationPolicy === 0 &&
    reliefInput.healthInsurance === 0
  ) {
    return undefined
  }

  return reliefInput
}

/**
 * Calculate total monthly insurance premiums for an employee
 */
export function calculateTotalMonthlyPremiums(
  premiums: InsurancePremium[] | undefined
): number {
  if (!premiums || premiums.length === 0) {
    return 0
  }

  return premiums
    .filter(p => p.isActive !== false)
    .reduce((total, premium) => {
      return total + (premium.monthlyPremium || premium.employeeShare || 0)
    }, 0)
}

/**
 * Get insurance premiums breakdown for display
 */
export function getInsurancePremiumsBreakdown(
  premiums: InsurancePremium[] | undefined
): {
  lifeInsurance: number
  educationPolicy: number
  healthInsurance: number
  other: number
  total: number
} {
  const breakdown = {
    lifeInsurance: 0,
    educationPolicy: 0,
    healthInsurance: 0,
    other: 0,
    total: 0
  }

  if (!premiums || premiums.length === 0) {
    return breakdown
  }

  const activePremiums = premiums.filter(p => p.isActive !== false)

  activePremiums.forEach(premium => {
    const amount = premium.monthlyPremium || premium.employeeShare || 0
    
    switch (premium.insuranceType?.toLowerCase()) {
      case 'life':
      case 'life insurance':
        breakdown.lifeInsurance += amount
        break
      case 'education':
      case 'education policy':
        breakdown.educationPolicy += amount
        break
      case 'health':
      case 'health insurance':
      case 'medical':
        breakdown.healthInsurance += amount
        break
      default:
        breakdown.other += amount
    }
    
    breakdown.total += amount
  })

  return breakdown
}