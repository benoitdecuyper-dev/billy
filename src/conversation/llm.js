/*
 * src/conversation/llm.js — appel LLM côté SERVEUR pour la SÉLECTION (jamais la génération).
 *
 * Le LLM ne produit JAMAIS le texte prononcé par Billy : on le force (tool_choice) à appeler
 * l'outil `choisir`, qui ne renvoie qu'un CHOIX structuré (id de réplique du menu, mot repris à
 * l'enfant, signal, phase suivante). C'est selector.finalize() qui résout et VALIDE ce choix.
 *
 * Clé jamais exposée au navigateur (reste dans process.env). Sans clé -> null (repli déterministe).
 * Fournisseur : Claude (Anthropic). Modèle par défaut : claude-opus-4-8 (cf. .env.example).
 */

'use strict';

const API_URL = 'https://api.anthropic.com/v1/messages';

const DECISION_TOOL = {
  name: 'choisir',
  description: "Choisir la prochaine réplique de Billy DANS le menu fourni. Ne jamais inventer de texte.",
  input_schema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['say', 'cued_invitation', 'open'],
        description: "say = jouer une réplique du menu (phraseId) ; cued_invitation = inviter en reprenant un mot exact de l'enfant (cuedWord) ; open = invitation ouverte neutre.",
      },
      phraseId: { type: 'string', description: "id EXACT d'une réplique du menu (requis si action=say)." },
      cuedWord: { type: 'string', description: "UN mot EXACT déjà prononcé par l'enfant (requis si action=cued_invitation)." },
      nextPhase: { type: 'string', description: "id de la phase suivante si le but de la phase est atteint, sinon vide." },
      signal: {
        type: 'string',
        enum: ['none', 'distress', 'disclosure', 'danger'],
        description: "none par défaut ; distress (détresse), disclosure (révélation grave), danger (danger/douleur/peur d'une personne/secret).",
      },
      rationale: { type: 'string', description: "Justification courte (jamais prononcée, sert aux logs)." },
    },
    required: ['action', 'signal'],
  },
};

function llmAvailable() { return !!process.env.ANTHROPIC_API_KEY; }

/* prompt = { system, user } (construit par selector.buildPrompt). Renvoie la décision (input de l'outil) ou null. */
async function selectViaLLM(prompt, { timeoutMs = 4000 } = {}) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || !prompt) return null;
  const model = process.env.BILLY_LLM_MODEL || 'claude-haiku-4-5';
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(API_URL, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model,
        max_tokens: 300,
        temperature: 0,
        system: prompt.system,
        messages: [{ role: 'user', content: prompt.user }],
        tools: [DECISION_TOOL],
        tool_choice: { type: 'tool', name: 'choisir' },
      }),
    });
    if (!r.ok) return null;
    const data = await r.json();
    const tool = (data.content || []).find((c) => c.type === 'tool_use' && c.name === 'choisir');
    return tool && tool.input && typeof tool.input === 'object' ? tool.input : null;
  } catch {
    return null; // timeout, réseau, parsing -> repli déterministe (fail-closed)
  } finally {
    clearTimeout(timer);
  }
}

export { selectViaLLM, llmAvailable, DECISION_TOOL };
