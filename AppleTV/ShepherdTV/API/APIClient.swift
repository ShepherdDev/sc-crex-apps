import Foundation

enum APIError: LocalizedError {
    case badURL
    case status(Int)
    case unreadable

    var errorDescription: String? {
        switch self {
        case .badURL: return "Something's wrong with that link."
        case .status(let code): return "We couldn't reach Shepherd Church (error \(code))."
        case .unreadable: return "We got an answer we couldn't read."
        }
    }
}

enum API {
    /// GET an endpoint. Accepts "home", a "/api/..." path, or a full URL.
    static func get<T: Decodable>(_ path: String, as type: T.Type = T.self) async throws -> T {
        let full: String
        if path.hasPrefix("http") {
            full = path
        } else if path.hasPrefix("/") {
            full = Config.rockHost + path
        } else {
            full = Config.apiBase + "/" + path
        }
        guard let url = URL(string: full) else { throw APIError.badURL }

        var request = URLRequest(url: url)
        request.timeoutInterval = 20
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        let (data, response) = try await URLSession.shared.data(for: request)
        let code = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard code == 200 else { throw APIError.status(code) }
        do {
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            print("[api] decode failed for \(full): \(error)")
            throw APIError.unreadable
        }
    }

    static func home() async throws -> HomeResponse { try await get("home") }
    static func series(_ path: String) async throws -> SeriesResponse { try await get(path) }
    static func seriesList(_ path: String) async throws -> SeriesListResponse { try await get(path) }
    static func message(id: String) async throws -> Message {
        let encoded = id.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? id
        let r: MessageResponse = try await get("message?id=\(encoded)")
        return r.message
    }

    /// A user-facing sentence for any error.
    static func describe(_ error: Error) -> String {
        if let e = error as? LocalizedError, let text = e.errorDescription { return text }
        if (error as? URLError)?.code == .notConnectedToInternet {
            return "This Apple TV isn't connected to the internet."
        }
        return "We couldn't reach Shepherd Church. Check your internet connection."
    }
}
