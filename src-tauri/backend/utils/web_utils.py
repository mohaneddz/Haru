from bs4 import BeautifulSoup
import json
import html

class ContentExtractor:
    def __init__(self):
        pass

    @staticmethod
    def _extract_json_ld(html_content: str) -> dict:
        soup = BeautifulSoup(html_content, 'html.parser')
        json_ld_scripts = soup.find_all('script', type='application/ld+json')
        extracted_data = {}
        for script in json_ld_scripts:
            try:
                data = json.loads(script.string)
                if isinstance(data, list):
                    data = data[0] if data else {}
                if data.get('@type') in ['Movie', 'TVSeries', 'TVEpisode']:
                    extracted_data.update({
                        'title': data.get('name'),
                        'release_date': data.get('datePublished') or data.get('dateCreated'),
                        'description': data.get('description')
                    })
                if 'award' in data or 'awards' in data:
                    extracted_data['awards'] = data.get('award') or data.get('awards', [])
            except (json.JSONDecodeError, AttributeError, TypeError):
                continue
        return extracted_data

    @staticmethod
    def _extract_meta_tags(html_content: str) -> dict:
        soup = BeautifulSoup(html_content, 'html.parser')
        extracted_data = {}
        og_tags = {
            'og:title': 'title', 'og:description': 'description',
            'article:published_time': 'published_date', 'og:type': 'content_type'
        }
        for prop, key in og_tags.items():
            meta = soup.find('meta', property=prop)
            if meta and meta.get('content'):
                extracted_data[key] = meta['content']
        return extracted_data

    def extract_structured_fields(self, html_content: str) -> dict:
        if not html_content:
            return {}
        json_ld_data = self._extract_json_ld(html_content)
        meta_data = self._extract_meta_tags(html_content)
        return {**meta_data, **json_ld_data}

    @staticmethod
    def intelligent_truncate(text: str, max_tokens: int = 500) -> str:
        if len(text.split()) <= max_tokens:
            return text
        truncated = text[:max_tokens * 4]
        last_punc = max(truncated.rfind('.'), truncated.rfind('!'), truncated.rfind('?'))
        if last_punc > 0:
            return truncated[:last_punc + 1]
        return truncated + "..."

    def extract_relevant_sections(self, content: str, html_content: str, **kwargs) -> tuple[str, float, dict]:
        if not content:
            return "", 0.0, {}
        structured_fields = self.extract_structured_fields(html_content)
        cleaned_content = html.unescape(content or "").strip()
        truncated_content = self.intelligent_truncate(cleaned_content, 600)

        query = kwargs.get("query", "")
        semantic_score = 0.0
        if query:
            query_tokens = set(query.lower().split())
            content_tokens = set(truncated_content.lower().split())
            if query_tokens:
                semantic_score = len(query_tokens & content_tokens) / len(query_tokens)

        return truncated_content, semantic_score, structured_fields
