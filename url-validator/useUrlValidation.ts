import { ReadonlyURLSearchParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

type UrlValidationProps = {
  /**
   * Checks for location.pathname
   */
  pathCheckRules?: {
    /**
     * Test pathname
     * @param pathname current pathname
     * @returns if pathname is valid
     */
    test: (pathname: string) => boolean
    /**
     * Return valid pathname based on current pathname
     * @param pathname invalid pathname
     * @returns new pathname that will replace current URL
     */
    getValidPathname: (pathname: string) => string
    /**
     * Will be triggered on check failure
     */
    onFail?: () => void
    /**
     * Will be triggered after all checks have passed
     */
    onSuccess?: () => void
  }[]
  /**
   * Checks for search parameters
   */
  searchParamsCheckRules?: {
    /**
     * Search key
     */
    key: string
    /**
     * Test value
     * @param value current value
     * @returns if value is valid
     */
    testValue?: (value: string) => boolean
    /**
     * Will be set if some check fails
     */
    defaultValue?: string
    /**
     * Will be triggered on check failure
     */
    onFail?: () => void
    /**
     * Will be triggered after all checks have passed
     * @param value valid value of search parameter
     */
    onSuccess?: (value: string) => void
  }[]
}

/**
 * Will check if URL is valid and trigger events on success/failure
 */
export const useUrlValidation = ({
  pathCheckRules,
  searchParamsCheckRules,
}: UrlValidationProps) => {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const cachedRules = useRef({
    pathRules: pathCheckRules,
    searchRules: searchParamsCheckRules,
  })

  useEffect(() => {
    let validPathname = pathname
    let validSearchParams: ReadonlyURLSearchParams | URLSearchParams = searchParams
    let shouldReplace = false

    const { pathRules, searchRules } = cachedRules.current

    if (pathRules) {
      pathRules.forEach(({ test, getValidPathname, onFail, onSuccess }) => {
        if (!test(pathname)) {
          onFail?.()

          validPathname = getValidPathname(pathname)
          shouldReplace = true
        } else {
          onSuccess?.()
        }
      })
    }

    if (searchRules) {
      searchRules.forEach(({ key, testValue, defaultValue, onFail, onSuccess }) => {
        const param = searchParams.get(key)

        if (param === null || (testValue && !testValue(param))) {
          onFail?.()

          if (defaultValue) {
            shouldReplace = true

            const newSearchParams = new URLSearchParams(searchParams)
            newSearchParams.set(key, defaultValue ?? '')

            validSearchParams = newSearchParams
          }
        } else {
          onSuccess?.(param)
        }
      })
    }

    if (shouldReplace) {
      router.replace(`${validPathname}?${validSearchParams.toString()}`)
    }
  }, [pathname, searchParams, router])
}
