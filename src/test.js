const changeCase = require('change-case')
const { log } = require('console')

// const whichCase = {
//   camelCase: 'mergeMap',
//   pascalCase: 'PriorityQueue',
//   constantCase: 'MAX_SIZE',
//   dotCase: 'editor.line.number',
//   capitalCase: 'Launch Edge And Attach DevTools',
//   noCase: 'today is sunny',
//   headerCase: 'Set-Location',
//   snakeCase: 'by_selector',
//   pathCase: 'etc/apt/source/list',
//   sentenceCase: 'I will buy you something to eat.',
//   paramCase: 'data-source-code',
// }

// for (const [caseFn, dispatch] of Object.entries(changeCase)) {
//   log(`### ${caseFn} ->`)
//   for (const [key, casedText] of Object.entries(whichCase)) {
//     log(
//       `${
//         casedText.length < 40
//           ? casedText +
//             Array(Math.ceil((40 - casedText.length) / 8))
//               .fill('\t')
//               .join('')
//           : casedText
//       } ${key}\t\t\t=> ${dispatch(casedText)}`
//     )
//   }
// }
log(changeCase.pascalCaseTransform('helloWorld'))
log(changeCase.pascalCaseTransformMerge('helloWorld'))
log(changeCase.camelCaseTransform('HELLOWorld', 3))
log(changeCase.camelCaseTransformMerge('helloWorld', 3))
log(changeCase.capitalCaseTransform('delEnv'))
log(changeCase.sentenceCaseTransform('ABCdel-vab', 3))
