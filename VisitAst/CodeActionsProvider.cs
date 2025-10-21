
using System.Management.Automation.Language;

namespace VisitAst;

public class TransformAction
{
  static Ast UnpackParentheses(ParenExpressionAst ast)
  {
    return (Ast)ast;
  }
  public static string ToExpression(Ast ast) => ast switch
  {

    _ => throw new NotImplementedException()
  };
  public static string ToDoubleQuoted(StringConstantExpressionAst ast) => ast.StringConstantType switch
  {
    StringConstantType.DoubleQuoted or StringConstantType.DoubleQuotedHereString => ast.ToString(),
    StringConstantType.SingleQuotedHereString => $"@\"\n{ast.Value}\n\"@",
    _ => $"\"{ast.Value}\""
  };
  public static string ExpandableToConcat(ExpandableStringExpressionAst ast) => ast.StringConstantType switch
  {
    StringConstantType.DoubleQuoted => ast.ToString(),
    StringConstantType.DoubleQuotedHereString => ast.ToString(),
    _ => throw new NotImplementedException()
  };
  public static string GetExpandableToConcat(ExpandableStringExpressionAst ast)
  {
    List<string> strings = [];
    foreach (var expression in ast.NestedExpressions)
    {
      if (expression is SubExpressionAst sub)
      {
        strings.Add(sub.SubExpression.ToString());
      }
    }
    return "";
  }
}

public class CodeActionProvider
{

}
