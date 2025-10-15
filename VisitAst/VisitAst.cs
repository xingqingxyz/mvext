using System.Management.Automation;
using System.Management.Automation.Language;

namespace VisitAst;

public class AstNodeVisitor
{
  public record AstNode(string Id, string FieldName, string TypeName, int[] Range, Dictionary<string, object?> Meta, List<AstNode> Children)
  {
    public AstNode(Ast ast, string FieldName, Dictionary<string, object?> Meta, List<AstNode> Children) : this(id++.ToString(), FieldName, ast.GetType().Name, GetRange(ast.Extent), Meta, Children) { }
  }

  public record TokenNode(int[] Range, string Kind, string TokenFlags, bool HasError)
  {
    public TokenNode(Token token) : this(GetRange(token.Extent), token.Kind.ToString(), token.TokenFlags.ToString(), token.HasError) { }
  }

  public record AstTree(AstNode Root, TokenNode[] Tokens) { }

  private static ulong id = 0;

  private static int[] GetRange(IScriptExtent scriptExtent) => [scriptExtent
  .StartLineNumber - 1, scriptExtent.StartColumnNumber - 1, scriptExtent.EndLineNumber - 1, scriptExtent.EndColumnNumber - 1];

  private static AstNode VisitAst(string fieldName, Ast ast)
  {
    var range = GetRange(ast.Extent);
    List<AstNode> children = [];
    Dictionary<string, object?> meta = [];
    foreach (var prop in ast.GetType().GetProperties())
    {
      if (prop.DeclaringType?.IsSubclassOf(typeof(Ast)) != true)
      {
        continue;
      }
      var name = prop.Name;
      var value = prop.GetValue(ast);
      if (value == null)
      {
        meta[name] = value;
        continue;
      }
      if (value is Ast ast1)
      {
        children.Add(VisitAst(name, ast1));
        continue;
      }

      var id = 0;
      if (value is IReadOnlyCollection<Ast> asts)
      {
        if (asts.Count == 0)
        {
          meta[name] = asts;
          continue;
        }
        foreach (var ast2 in asts)
        {
          children.Add(VisitAst($"{name}[{id++}]", ast2));
        }
      }
      else if (value is IReadOnlyCollection<object> objects)
      {
        if (objects.Count == 0)
        {
          meta[name] = objects;
          continue;
        }
        foreach (var item in objects)
        {
          if (item is (Ast a, Ast b))
          {
            children.Add(VisitAst($"{name}[{id++}]", a));
            children.Add(VisitAst($"{name}[{id++}]", b));
          }
        }
      }
      else
      {
        meta[name] = value switch
        {
          Enum or Type => value.ToString(),
          string or ValueType or VariablePath or ScriptRequirements => value,
          Token t => new TokenNode(t),
          ITypeName t => new { t.AssemblyName, t.FullName, t.IsArray, t.IsGeneric, t.Name, Range = GetRange(t.Extent) },
          IScriptExtent t => GetRange(t),
          DynamicKeyword t => new { t.BodyMode, t.DirectCall, t.HasReservedProperties, t.ImplementingModule, t.ImplementingModuleVersion, t.IsReservedKeyword, t.Keyword, t.MetaStatement, t.NameMode, t.Parameters, t.Properties, t.ResourceName },
          var t => t.ToString()
        };
      }
    }
    foreach (var method in ast.GetType().GetMethods())
    {
      if (method.Name is "GetHelpContent" or "IsConstantVariable" && method.GetParameters().Length == 0 && method.DeclaringType?.IsSubclassOf(typeof(Ast)) == true)
      {
        meta[$"{method.Name}()"] = method.Invoke(ast, null);
      }
    }
    return new(ast, fieldName, meta, children);
  }

  public static AstTree Visit(string input)
  {
    var ast = Parser.ParseInput(input, out Token[] tokens, out ParseError[] _);
    return new(VisitAst("ScriptFile", ast), [.. from token in tokens select new TokenNode(token)]);
  }
}
