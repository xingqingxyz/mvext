export const enum cpp {
  'identifier' = 1,
  '#include' = 2,
  '#define' = 4,
  '(' = 5,
  '...' = 6,
  ',' = 7,
  ')' = 8,
  '#if' = 9,
  '\n' = 10,
  '#endif' = 11,
  '#ifdef' = 12,
  '#ifndef' = 13,
  '#else' = 14,
  '#elif' = 15,
  '#elifdef' = 16,
  '#elifndef' = 17,
  'preproc_arg' = 18,
  'preproc_directive' = 19,
  'defined' = 21,
  '!' = 22,
  '~' = 23,
  '-' = 24,
  '+' = 25,
  '*' = 26,
  '/' = 27,
  '%' = 28,
  '||' = 29,
  '&&' = 30,
  '|' = 31,
  '^' = 32,
  '&' = 33,
  '==' = 34,
  '!=' = 35,
  '>' = 36,
  '>=' = 37,
  '<=' = 38,
  '<' = 39,
  '<<' = 40,
  '>>' = 41,
  ';' = 42,
  '__extension__' = 43,
  'typedef' = 44,
  'virtual' = 45,
  'extern' = 46,
  '__attribute__' = 47,
  '__attribute' = 48,
  '::' = 49,
  '[[' = 50,
  ']]' = 51,
  '__declspec' = 52,
  '__based' = 53,
  '__cdecl' = 54,
  '__clrcall' = 55,
  '__stdcall' = 56,
  '__fastcall' = 57,
  '__thiscall' = 58,
  '__vectorcall' = 59,
  'ms_restrict_modifier' = 60,
  'ms_unsigned_ptr_modifier' = 61,
  'ms_signed_ptr_modifier' = 62,
  '_unaligned' = 63,
  '__unaligned' = 64,
  '{' = 65,
  '}' = 66,
  'signed' = 67,
  'unsigned' = 68,
  'long' = 69,
  'short' = 70,
  '[' = 71,
  'static' = 72,
  ']' = 73,
  '=' = 74,
  'register' = 75,
  'inline' = 76,
  '__inline' = 77,
  '__inline__' = 78,
  '__forceinline' = 79,
  'thread_local' = 80,
  '__thread' = 81,
  'const' = 82,
  'constexpr' = 83,
  'volatile' = 84,
  'restrict' = 85,
  '__restrict__' = 86,
  '_Atomic' = 87,
  '_Noreturn' = 88,
  'noreturn' = 89,
  '_Nonnull' = 90,
  'mutable' = 91,
  'constinit' = 92,
  'consteval' = 93,
  'alignas' = 94,
  '_Alignas' = 95,
  'primitive_type' = 96,
  'enum' = 97,
  'class' = 98,
  'struct' = 99,
  'union' = 100,
  ':' = 101,
  'if' = 102,
  'else' = 103,
  'switch' = 104,
  'case' = 105,
  'default' = 106,
  'while' = 107,
  'do' = 108,
  'for' = 109,
  'return' = 110,
  'break' = 111,
  'continue' = 112,
  'goto' = 113,
  '__try' = 114,
  '__except' = 115,
  '__finally' = 116,
  '__leave' = 117,
  '?' = 118,
  '*=' = 119,
  '/=' = 120,
  '%=' = 121,
  '+=' = 122,
  '-=' = 123,
  '<<=' = 124,
  '>>=' = 125,
  '&=' = 126,
  '^=' = 127,
  '|=' = 128,
  'and_eq' = 129,
  'or_eq' = 130,
  'xor_eq' = 131,
  'not' = 132,
  'compl' = 133,
  '<=>' = 134,
  'or' = 135,
  'and' = 136,
  'bitor' = 137,
  'xor' = 138,
  'bitand' = 139,
  'not_eq' = 140,
  '--' = 141,
  '++' = 142,
  'sizeof' = 143,
  '__alignof__' = 144,
  '__alignof' = 145,
  '_alignof' = 146,
  'alignof' = 147,
  '_Alignof' = 148,
  'offsetof' = 149,
  '_Generic' = 150,
  'asm' = 151,
  '__asm__' = 152,
  '__asm' = 153,
  '__volatile__' = 154,
  '.' = 155,
  '.*' = 156,
  '->' = 157,
  'number_literal' = 158,
  "L'" = 159,
  "u'" = 160,
  "U'" = 161,
  "u8'" = 162,
  "'" = 163,
  'character' = 164,
  'L"' = 165,
  'u"' = 166,
  'U"' = 167,
  'u8"' = 168,
  '"' = 169,
  'string_content' = 170,
  'escape_sequence' = 171,
  'system_lib_string' = 172,
  'true' = 173,
  'false' = 174,
  'NULL' = 175,
  'nullptr' = 176,
  'comment' = 177,
  'auto' = 178,
  'final' = 180,
  'override' = 181,
  'explicit' = 182,
  'typename' = 183,
  'template' = 184,
  'operator' = 186,
  'try' = 187,
  'delete' = 188,
  'friend' = 190,
  'public' = 191,
  'private' = 192,
  'protected' = 193,
  'throw' = 195,
  'namespace' = 196,
  'using' = 197,
  'static_assert' = 198,
  'concept' = 199,
  'co_return' = 200,
  'co_yield' = 201,
  'catch' = 202,
  'R"' = 203,
  'LR"' = 204,
  'uR"' = 205,
  'UR"' = 206,
  'u8R"' = 207,
  'co_await' = 208,
  'new' = 209,
  'requires' = 210,
  '->*' = 211,
  '()' = 212,
  '[]' = 213,
  '""' = 214,
  'this' = 215,
  'literal_suffix' = 216,
  'raw_string_delimiter' = 217,
  'raw_string_content' = 218,
  'translation_unit' = 219,
  'preproc_include' = 222,
  'preproc_def' = 223,
  'preproc_function_def' = 224,
  'preproc_params' = 225,
  'preproc_call' = 226,
  'preproc_if' = 227,
  'preproc_ifdef' = 228,
  'preproc_else' = 229,
  'preproc_elif' = 230,
  'preproc_elifdef' = 231,
  'preproc_defined' = 249,
  'function_definition' = 254,
  'declaration' = 255,
  'type_definition' = 256,
  'linkage_specification' = 261,
  'attribute_specifier' = 262,
  'attribute' = 263,
  'attribute_declaration' = 264,
  'ms_declspec_modifier' = 265,
  'ms_based_modifier' = 266,
  'ms_call_modifier' = 267,
  'ms_unaligned_ptr_modifier' = 268,
  'ms_pointer_modifier' = 269,
  'declaration_list' = 270,
  'parenthesized_declarator' = 275,
  'abstract_parenthesized_declarator' = 278,
  'attributed_declarator' = 279,
  'pointer_declarator' = 282,
  'pointer_type_declarator' = 284,
  'abstract_pointer_declarator' = 285,
  'function_declarator' = 286,
  'abstract_function_declarator' = 289,
  'array_declarator' = 290,
  'abstract_array_declarator' = 293,
  'init_declarator' = 294,
  'compound_statement' = 295,
  'storage_class_specifier' = 296,
  'type_qualifier' = 297,
  'alignas_qualifier' = 298,
  'sized_type_specifier' = 300,
  'enum_specifier' = 301,
  'enumerator_list' = 302,
  'struct_specifier' = 303,
  'union_specifier' = 304,
  'field_declaration_list' = 305,
  'field_declaration' = 307,
  'bitfield_clause' = 308,
  'enumerator' = 309,
  'parameter_list' = 310,
  'parameter_declaration' = 311,
  'attributed_statement' = 312,
  'labeled_statement' = 315,
  'expression_statement' = 317,
  'if_statement' = 318,
  'else_clause' = 319,
  'switch_statement' = 320,
  'case_statement' = 321,
  'while_statement' = 322,
  'do_statement' = 323,
  'for_statement' = 324,
  'return_statement' = 326,
  'break_statement' = 327,
  'continue_statement' = 328,
  'goto_statement' = 329,
  'seh_try_statement' = 330,
  'seh_except_clause' = 331,
  'seh_finally_clause' = 332,
  'seh_leave_statement' = 333,
  'comma_expression' = 336,
  'conditional_expression' = 337,
  'assignment_expression' = 338,
  'pointer_expression' = 339,
  'unary_expression' = 340,
  'binary_expression' = 341,
  'update_expression' = 342,
  'cast_expression' = 343,
  'type_descriptor' = 344,
  'sizeof_expression' = 345,
  'alignof_expression' = 346,
  'offsetof_expression' = 347,
  'generic_expression' = 348,
  'subscript_expression' = 349,
  'call_expression' = 350,
  'gnu_asm_expression' = 351,
  'gnu_asm_qualifier' = 352,
  'gnu_asm_output_operand_list' = 353,
  'gnu_asm_output_operand' = 354,
  'gnu_asm_input_operand_list' = 355,
  'gnu_asm_input_operand' = 356,
  'gnu_asm_clobber_list' = 357,
  'gnu_asm_goto_list' = 358,
  'extension_expression' = 359,
  'argument_list' = 360,
  'field_expression' = 361,
  'compound_literal_expression' = 362,
  'parenthesized_expression' = 363,
  'initializer_list' = 364,
  'initializer_pair' = 365,
  'subscript_designator' = 366,
  'subscript_range_designator' = 367,
  'field_designator' = 368,
  'char_literal' = 369,
  'concatenated_string' = 370,
  'string_literal' = 371,
  'null' = 372,
  'placeholder_type_specifier' = 374,
  'decltype' = 376,
  'class_specifier' = 379,
  'virtual_specifier' = 381,
  'explicit_function_specifier' = 382,
  'base_class_clause' = 383,
  'dependent_type' = 385,
  'template_declaration' = 386,
  'template_instantiation' = 387,
  'template_parameter_list' = 388,
  'type_parameter_declaration' = 389,
  'variadic_type_parameter_declaration' = 390,
  'optional_type_parameter_declaration' = 391,
  'template_template_parameter_declaration' = 392,
  'optional_parameter_declaration' = 393,
  'variadic_parameter_declaration' = 394,
  'variadic_declarator' = 395,
  'operator_cast' = 397,
  'field_initializer_list' = 398,
  'field_initializer' = 399,
  'default_method_clause' = 407,
  'delete_method_clause' = 408,
  'pure_virtual_clause' = 409,
  'friend_declaration' = 410,
  'access_specifier' = 411,
  'reference_declarator' = 412,
  'abstract_reference_declarator' = 415,
  'structured_binding_declarator' = 416,
  'ref_qualifier' = 417,
  'trailing_return_type' = 423,
  'noexcept' = 424,
  'throw_specifier' = 425,
  'template_type' = 426,
  'template_method' = 427,
  'template_function' = 428,
  'template_argument_list' = 429,
  'namespace_definition' = 430,
  'namespace_alias_definition' = 431,
  'nested_namespace_specifier' = 433,
  'using_declaration' = 434,
  'alias_declaration' = 435,
  'static_assert_declaration' = 436,
  'concept_definition' = 437,
  'for_range_loop' = 438,
  'init_statement' = 440,
  'condition_clause' = 441,
  'co_return_statement' = 443,
  'co_yield_statement' = 444,
  'throw_statement' = 445,
  'try_statement' = 446,
  'catch_clause' = 447,
  'raw_string_literal' = 448,
  'subscript_argument_list' = 449,
  'co_await_expression' = 450,
  'new_expression' = 451,
  'new_declarator' = 452,
  'delete_expression' = 453,
  'type_requirement' = 454,
  'compound_requirement' = 455,
  'requirement_seq' = 457,
  'constraint_conjunction' = 458,
  'constraint_disjunction' = 459,
  'requires_clause' = 461,
  'requires_expression' = 463,
  'lambda_expression' = 464,
  'lambda_capture_specifier' = 465,
  'lambda_default_capture' = 466,
  'lambda_capture_initializer' = 468,
  'fold_expression' = 475,
  'parameter_pack_expansion' = 476,
  'destructor_name' = 479,
  'dependent_name' = 480,
  'qualified_identifier' = 485,
  'operator_name' = 489,
  'user_defined_literal' = 490,
  'field_identifier' = 538,
  'namespace_identifier' = 539,
  'simple_requirement' = 540,
  'statement_identifier' = 541,
  'type_identifier' = 542,
}
