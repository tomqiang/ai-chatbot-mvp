# LLM Call Analysis & Cost Estimation

## LLM Calls Per User Input

### 1. New Chapter Generation (POST /api/chat)

**Total: 3 LLM calls**

1. **`generateStory()`** - Story text generation
   - Operation: `chapter`
   - Model: `gpt-4o-mini`
   - Max tokens: 1200
   - Output: ~500-900 Chinese characters of story text
   - Input tokens: ~800-1200 (summary + userEvent + system prompt)
   - Output tokens: ~300-600 (story text)

2. **`updateSummaryTitleAndSuggestions()`** - Summary & title generation
   - Operation: `metadata`
   - Model: `gpt-4o-mini`
   - Max tokens: 500
   - Output: JSON with summary, title, suggestions
   - Input tokens: ~1000-1500 (oldSummary + userEvent + storyText + prompt)
   - Output tokens: ~200-400 (JSON response)

3. **`generateAnchoredSuggestions()`** - Anchors & suggestions generation
   - Operation: `metadata`
   - Model: `gpt-4o-mini`
   - Max tokens: 600
   - Output: Anchors (A, B, C) + 5 suggestions
   - Input tokens: ~800-1200 (summary + userEvent + storyTail + prompt)
   - Output tokens: ~150-300 (anchors + suggestions text)

### 2. Rewrite Latest Chapter (POST /api/rewrite-latest)

**Total: 3 LLM calls**

1. **`generateSummaryUpToDay()`** - Regenerate summary up to previous day
   - Operation: `metadata`
   - Model: `gpt-4o-mini`
   - Max tokens: 500
   - Input tokens: ~500-2000 (varies by number of previous entries)
   - Output tokens: ~100-200 (summary text)

2. **`generateStory()`** - Rewrite story text
   - Same as call #1 in new chapter generation
   - Input tokens: ~800-1200
   - Output tokens: ~300-600

3. **`updateSummaryTitleAndSuggestions()`** - Update metadata
   - Same as call #2 in new chapter generation
   - This internally calls `generateAnchoredSuggestions()`
   - Input tokens: ~1000-1500
   - Output tokens: ~200-400

## Token Usage Estimates

### Per New Chapter (Typical):
- **Input tokens**: ~2,600 - 3,900 tokens
- **Output tokens**: ~650 - 1,300 tokens
- **Total tokens**: ~3,250 - 5,200 tokens

### Per Rewrite (Typical):
- **Input tokens**: ~2,300 - 4,700 tokens (varies with story length)
- **Output tokens**: ~600 - 1,200 tokens
- **Total tokens**: ~2,900 - 5,900 tokens

## Cost Calculation

### GPT-4o-mini Pricing (as of 2024):
- **Input tokens**: $0.15 per 1M tokens ($0.00015 per 1K tokens)
- **Output tokens**: $0.60 per 1M tokens ($0.0006 per 1K tokens)

### Cost Per New Chapter:

**Conservative estimate (lower token usage):**
- Input: 2,600 tokens × $0.00015 = **$0.00039**
- Output: 650 tokens × $0.0006 = **$0.00039**
- **Total: ~$0.00078 per chapter**

**Typical estimate (average token usage):**
- Input: 3,250 tokens × $0.00015 = **$0.00049**
- Output: 1,000 tokens × $0.0006 = **$0.00060**
- **Total: ~$0.00109 per chapter**

**High estimate (maximum token usage):**
- Input: 3,900 tokens × $0.00015 = **$0.00059**
- Output: 1,300 tokens × $0.0006 = **$0.00078**
- **Total: ~$0.00137 per chapter**

### Cost Per Rewrite:

**Typical estimate:**
- Input: 3,500 tokens × $0.00015 = **$0.00053**
- Output: 900 tokens × $0.0006 = **$0.00054**
- **Total: ~$0.00107 per rewrite**

## Monthly Cost Estimates

Assuming:
- 30 chapters per month (1 per day)
- 5 rewrites per month

**Conservative (low usage):**
- 30 chapters × $0.00078 = $0.0234
- 5 rewrites × $0.00107 = $0.0054
- **Monthly total: ~$0.03**

**Typical (average usage):**
- 30 chapters × $0.00109 = $0.0327
- 5 rewrites × $0.00107 = $0.0054
- **Monthly total: ~$0.04**

**High usage (maximum):**
- 30 chapters × $0.00137 = $0.0411
- 5 rewrites × $0.00107 = $0.0054
- **Monthly total: ~$0.05**

## Cost Optimization Notes

1. **Current architecture**: 3 LLM calls per chapter is necessary for:
   - Story generation (main content)
   - Summary/title generation (metadata)
   - Anchored suggestions (context-aware recommendations)

2. **Potential optimizations**:
   - Combine summary/title and anchored suggestions into one call (would reduce from 3 to 2 calls)
   - Cache summaries for older entries to reduce input tokens in rewrite operations
   - Use shorter prompts where possible

3. **Token usage factors**:
   - Story length grows over time (summary gets longer)
   - Chinese text: ~1.5-2 tokens per character
   - System prompts add ~50-100 tokens per call

## Summary

- **LLM calls per new chapter**: 3 calls
- **LLM calls per rewrite**: 3 calls
- **Cost per chapter**: ~$0.001 (1/10th of a cent)
- **Monthly cost (30 chapters)**: ~$0.03 - $0.05

The cost is very low due to using `gpt-4o-mini`, which is OpenAI's most cost-effective model. The 3-call architecture ensures high-quality, context-aware story generation with anchored suggestions.
