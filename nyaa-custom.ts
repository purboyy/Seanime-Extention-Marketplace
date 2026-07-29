class Provider {
    private api = "https://nyaa.si"

    async search(opts: AnimeSearchOptions): Promise<AnimeTorrent[]> {
        let searchQuery = opts.query || ""
        if (opts.media && opts.media.title) {
            searchQuery = opts.media.title.romaji || opts.media.title.english || searchQuery
        }

        // Category 1_2 corresponds to Anime - Anime Translated on Nyaa
        const url = `${this.api}/?page=rss&q=${encodeURIComponent(searchQuery)}&c=1_2&f=0`
        
        try {
            const res = await WORKER.fetch(url)
            const text = await res.text()
            
            return this.parseRss(text)
        } catch (err) {
            console.error("Error fetching Nyaa torrents:", err)
            return []
        }
    }

    async latest(): Promise<AnimeTorrent[]> {
        return this.search({ query: "" } as AnimeSearchOptions)
    }

    private parseRss(xmlText: string): AnimeTorrent[] {
        const torrents: AnimeTorrent[] = []
        const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/g)

        if (!itemMatches) return torrents

        for (const itemStr of itemMatches) {
            const titleMatch = itemStr.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)
            const linkMatch = itemStr.match(/<link>(.*?)<\/link>/)
            const guidMatch = itemStr.match(/<guid.*?>(.*?)<\/guid>/)
            const pubDateMatch = itemStr.match(/<pubDate>(.*?)<\/pubDate>/)
            
            // Nyaa specific XML tags
            const seedersMatch = itemStr.match(/<nyaa:seeders>(.*?)<\/nyaa:seeders>/)
            const leechersMatch = itemStr.match(/<nyaa:leechers>(.*?)<\/nyaa:leechers>/)
            const downloadsMatch = itemStr.match(/<nyaa:downloads>(.*?)<\/nyaa:downloads>/)
            const infoHashMatch = itemStr.match(/<nyaa:infoHash>(.*?)<\/nyaa:infoHash>/)
            const sizeMatch = itemStr.match(/<nyaa:size>(.*?)<\/nyaa:size>/)
            const magnetMatch = itemStr.match(/<nyaa:magnetHash>(.*?)<\/nyaa:magnetHash>/)

            const title = titleMatch ? (titleMatch[1] || titleMatch[2] || "") : ""
            const link = linkMatch ? linkMatch[1] : ""
            const seeders = seedersMatch ? parseInt(seedersMatch[1], 10) || 0 : 0
            const leechers = leechersMatch ? parseInt(leechersMatch[1], 10) || 0 : 0
            const size = sizeMatch ? sizeMatch[1] : "0 MB"
            
            // Generate a magnet link if infoHash is available
            let magnet = ""
            const infoHash = infoHashMatch ? infoHashMatch[1] : ""
            if (infoHash) {
                magnet = `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(title)}`
            }

            if (title) {
                torrents.push({
                    id: guidMatch ? guidMatch[1] : link,
                    name: title,
                    url: link,
                    magnet: magnet,
                    size: size,
                    seeders: seeders,
                    leechers: leechers,
                    episodeNumber: 0, // Seanime handles episode matching automatically based on the title string
                })
            }
        }

        return torrents
    }
}
