namespace ProductCatalog.Application.Services;

public class SearchCacheService
{
    private readonly Dictionary<string, CachedSearchResult> _cache = new();
    private readonly object _lock = new();
    private readonly TimeSpan _defaultCacheExpiry = TimeSpan.FromMinutes(5);

    public void Set(string key, object data, TimeSpan? expiry = null)
    {
        lock (_lock)
        {
            var expiryTime = DateTime.UtcNow.Add(expiry ?? _defaultCacheExpiry);
            _cache[key] = new CachedSearchResult(data, expiryTime);
        }
    }

    public T? Get<T>(string key) where T : class
    {
        lock (_lock)
        {
            if (!_cache.TryGetValue(key, out var cached))
                return null;

            if (DateTime.UtcNow > cached.ExpiryTime)
            {
                _cache.Remove(key);
                return null;
            }

            return cached.Data as T;
        }
    }

    public bool TryGet<T>(string key, out T? value) where T : class
    {
        value = Get<T>(key);
        return value != null;
    }

    public void Remove(string key)
    {
        lock (_lock)
        {
            _cache.Remove(key);
        }
    }

    public void Clear()
    {
        lock (_lock)
        {
            _cache.Clear();
        }
    }

    public void CleanExpired()
    {
        lock (_lock)
        {
            var expiredKeys = _cache
                .Where(kvp => DateTime.UtcNow > kvp.Value.ExpiryTime)
                .Select(kvp => kvp.Key)
                .ToList();

            foreach (var key in expiredKeys)
            {
                _cache.Remove(key);
            }
        }
    }

    internal class CachedSearchResult
    {
        public object Data { get; }
        public DateTime ExpiryTime { get; }

        public CachedSearchResult(object data, DateTime expiryTime)
        {
            Data = data;
            ExpiryTime = expiryTime;
        }
    }
}
