import Foundation

// Response shapes from the Rock TV API. See Rock/helix/SETUP.md.

struct Message: Codable, Hashable, Identifiable {
    let id: String
    let title: String
    let description: String?
    let date: String            // yyyy-MM-ddTHH:mm:ss, church local time
    let speaker: String?
    let image: String?          // Rock path, e.g. /GetImage.ashx?Guid=...
    let videoUrl: String
    let seriesId: String?
    let seriesTitle: String?
}

struct Series: Codable, Hashable, Identifiable {
    let id: String
    let title: String
    let description: String?
    let date: String?
    let image: String?
    let messageCount: Int?
    let url: String
}

struct LiveStream: Codable, Hashable {
    let title: String
    let startTime: String       // HH:mm:ss
    let videoUrl: String
}

struct UpcomingStream: Codable, Hashable {
    let start: String
    let title: String
}

/// A home row holds either messages or series, depending on `type`.
struct HomeRow: Decodable, Identifiable, Hashable {
    let id: String
    let title: String
    let type: String
    let seriesId: String?
    let seeAllUrl: String?
    let messages: [Message]
    let series: [Series]

    private enum CodingKeys: String, CodingKey {
        case id, title, type, seriesId, seeAllUrl, items
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        title = try c.decode(String.self, forKey: .title)
        type = try c.decode(String.self, forKey: .type)
        seriesId = try c.decodeIfPresent(String.self, forKey: .seriesId)
        seeAllUrl = try c.decodeIfPresent(String.self, forKey: .seeAllUrl)
        if type == "series" {
            series = try c.decode([Series].self, forKey: .items)
            messages = []
        } else {
            messages = try c.decode([Message].self, forKey: .items)
            series = []
        }
    }
}

struct HomeResponse: Decodable {
    let timeZone: String?
    let generatedAt: String
    let live: LiveStream?
    let upcoming: [UpcomingStream]
    let hero: Message?
    let rows: [HomeRow]
}

struct SeriesResponse: Decodable {
    let series: Series
    let messages: [Message]
}

struct SeriesListResponse: Decodable {
    let title: String?
    let series: [Series]
}

struct MessageResponse: Decodable {
    let message: Message
}
