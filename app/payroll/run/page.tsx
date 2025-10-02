const handleCalculatePayroll = async () => {
  if (!selectedMonth || !selectedYear) {
    showToast('Please select month and year', 'error')
    return
  }

  if (!workingDays || parseInt(workingDays) < 1 || parseInt(workingDays) > 31) {
    showToast('Please enter valid working days (1-31)', 'error')
    return
  }

  try {
    setIsCalculating(true)
    const monthYear = `${selectedYear}-${selectedMonth}`
    
    const response = await fetch('/api/payroll/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        monthYear,
        workingDays: parseInt(workingDays),
      }),
    })

    if (!response.ok) {
      let errorMessage = 'Failed to calculate payroll'
      
      // Check if response has content
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        try {
          const error = await response.json()
          errorMessage = error.error || error.message || errorMessage
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError)
          // Try to get text response as fallback
          try {
            const textError = await response.text()
            if (textError) {
              errorMessage = textError
            }
          } catch (textError) {
            console.error('Error reading text response:', textError)
          }
        }
      } else {
        // Non-JSON response, try to get as text
        try {
          const textError = await response.text()
          if (textError) {
            errorMessage = textError
          }
        } catch (textError) {
          console.error('Error reading text response:', textError)
        }
      }
      
      throw new Error(errorMessage)
    }

    const preview = await response.json()
    
    if (!Array.isArray(preview)) {
      throw new Error('Invalid response format from server')
    }
    
    setPayrollPreview(preview)
    showToast(`Payroll calculated for ${preview.length} employees`, 'success')
  } catch (error: any) {
    console.error('Error calculating payroll:', error)
    showToast(error.message || 'Failed to calculate payroll', 'error')
  } finally {
    setIsCalculating(false)
  }
}