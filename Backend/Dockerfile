# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files and restore dependencies
COPY ["InventoryManagement.API/InventoryManagement.API.csproj", "InventoryManagement.API/"]
COPY ["InventoryManagement.Repository/InventoryManagement.Repository.csproj", "InventoryManagement.Repository/"]
COPY ["InventoryManagement.Service/InventoryManagement.Service.csproj", "InventoryManagement.Service/"]
RUN dotnet restore "InventoryManagement.API/InventoryManagement.API.csproj"

# Copy the remaining files
COPY . .

# Build and publish
WORKDIR "/src/InventoryManagement.API"
RUN dotnet publish "InventoryManagement.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Expose port 5097
ENV ASPNETCORE_URLS=http://+:5097
EXPOSE 5097

ENTRYPOINT ["dotnet", "InventoryManagement.API.dll"]
