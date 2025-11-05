import type { getParser } from './ts/parser'
import type { transformCaseHelper } from './util/transformCaseHelper'

export interface ExternalApi {
  transformCaseHelper: typeof transformCaseHelper
  getParser: typeof getParser
}
