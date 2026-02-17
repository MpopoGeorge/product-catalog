# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj files and restore dependencies
COPY ["ProductCatalog.Api/ProductCatalog.Api.csproj", "ProductCatalog.Api/"]
COPY ["ProductCatalog.Application/ProductCatalog.Application.csproj", "ProductCatalog.Application/"]
COPY ["ProductCatalog.Domain/ProductCatalog.Domain.csproj", "ProductCatalog.Domain/"]
COPY ["ProductCatalog.Infrastructure/ProductCatalog.Infrastructure.csproj", "ProductCatalog.Infrastructure/"]

RUN dotnet restore "ProductCatalog.Api/ProductCatalog.Api.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/ProductCatalog.Api"
RUN dotnet build "ProductCatalog.Api.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "ProductCatalog.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 80
EXPOSE 443

COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ProductCatalog.Api.dll"]
