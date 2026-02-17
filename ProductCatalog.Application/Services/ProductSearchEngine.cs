using System.Text;

namespace ProductCatalog.Application.Services;

public class ProductSearchEngine<T> where T : class
{
    private readonly Dictionary<string, Func<T, string>> _fieldExtractors;
    private readonly Dictionary<string, double> _fieldWeights;

    public ProductSearchEngine(Dictionary<string, Func<T, string>> fieldExtractors, Dictionary<string, double> fieldWeights)
    {
        _fieldExtractors = fieldExtractors ?? throw new ArgumentNullException(nameof(fieldExtractors));
        _fieldWeights = fieldWeights ?? throw new ArgumentNullException(nameof(fieldWeights));
    }

    public List<SearchResult<T>> Search(IEnumerable<T> items, string query, int maxResults = 50)
    {
        if (string.IsNullOrWhiteSpace(query))
            return items.Select(item => new SearchResult<T>(item, 0.0)).Take(maxResults).ToList();

        var normalizedQuery = NormalizeString(query);
        var results = new List<SearchResult<T>>();

        foreach (var item in items)
        {
            double totalScore = 0.0;
            double totalWeight = 0.0;

            foreach (var field in _fieldExtractors.Keys)
            {
                var fieldValue = _fieldExtractors[field](item) ?? string.Empty;
                var normalizedFieldValue = NormalizeString(fieldValue);
                
                if (string.IsNullOrEmpty(normalizedFieldValue))
                    continue;

                var weight = _fieldWeights.GetValueOrDefault(field, 1.0);
                var score = CalculateFuzzyScore(normalizedQuery, normalizedFieldValue);
                
                totalScore += score * weight;
                totalWeight += weight;
            }

            var finalScore = totalWeight > 0 ? totalScore / totalWeight : 0.0;
            
            if (finalScore > 0)
            {
                results.Add(new SearchResult<T>(item, finalScore));
            }
        }

        return results
            .OrderByDescending(r => r.Score)
            .Take(maxResults)
            .ToList();
    }

    private double CalculateFuzzyScore(string query, string text)
    {
        if (string.IsNullOrEmpty(query) || string.IsNullOrEmpty(text))
            return 0.0;

        if (text.Equals(query, StringComparison.OrdinalIgnoreCase))
            return 1.0;

        if (text.Contains(query, StringComparison.OrdinalIgnoreCase))
            return 0.8;

        if (IsFuzzySubstring(query, text))
            return 0.6;

        var distance = LevenshteinDistance(query, text);
        var maxLength = Math.Max(query.Length, text.Length);
        
        if (maxLength == 0) return 1.0;
        
        var similarity = 1.0 - (double)distance / maxLength;
        
        return similarity > 0.3 ? similarity * 0.4 : 0.0;
    }

    private bool IsFuzzySubstring(string query, string text)
    {
        if (query.Length > text.Length)
            return false;

        for (int i = 0; i <= text.Length - query.Length; i++)
        {
            var substring = text.Substring(i, Math.Min(query.Length, text.Length - i));
            var distance = LevenshteinDistance(query, substring);
            
            if (distance <= Math.Ceiling(query.Length * 0.3))
                return true;
        }

        return false;
    }

    private int LevenshteinDistance(string s, string t)
    {
        if (string.IsNullOrEmpty(s))
            return string.IsNullOrEmpty(t) ? 0 : t.Length;
        
        if (string.IsNullOrEmpty(t))
            return s.Length;

        int n = s.Length;
        int m = t.Length;
        int[,] d = new int[n + 1, m + 1];

        for (int i = 0; i <= n; d[i, 0] = i++) { }
        for (int j = 0; j <= m; d[0, j] = j++) { }

        for (int i = 1; i <= n; i++)
        {
            for (int j = 1; j <= m; j++)
            {
                int cost = (t[j - 1] == s[i - 1]) ? 0 : 1;
                d[i, j] = Math.Min(
                    Math.Min(d[i - 1, j] + 1, d[i, j - 1] + 1),
                    d[i - 1, j - 1] + cost);
            }
        }

        return d[n, m];
    }

    private string NormalizeString(string input)
    {
        if (string.IsNullOrEmpty(input))
            return string.Empty;

        var normalized = input.ToLowerInvariant().Trim();
        
        var sb = new StringBuilder(normalized.Length);
        foreach (char c in normalized)
        {
            var normalizedChar = RemoveDiacritics(c);
            sb.Append(normalizedChar);
        }

        return sb.ToString();
    }

    private char RemoveDiacritics(char c)
    {
        var normalized = c.ToString().Normalize(System.Text.NormalizationForm.FormD);
        var sb = new StringBuilder();
        
        foreach (var ch in normalized)
        {
            var category = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(ch);
            if (category != System.Globalization.UnicodeCategory.NonSpacingMark)
            {
                sb.Append(ch);
            }
        }

        return sb.Length > 0 ? sb[0] : c;
    }
}

public class SearchResult<T>
{
    public T Item { get; }
    public double Score { get; }

    public SearchResult(T item, double score)
    {
        Item = item;
        Score = score;
    }
}
