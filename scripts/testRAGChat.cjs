async function testRAGFlow() {
  console.log('Testing RAG endpoints on http://127.0.0.1:3001...');

  // 1. List docs
  const listRes = await fetch('http://127.0.0.1:3001/api/rag/documents');
  const listData = await listRes.json();
  console.log('Initial documents count:', listData.documents?.length || 0);

  // 2. Upload sample document via JSON base64
  const docContent = `Netroot AI Architecture Specification:
Netroot AI is a multi-model intelligence studio featuring zero-cost RAG vectorization.
It uses HuggingFace Transformers with Xenova/all-MiniLM-L6-v2 running locally on CPU in 14ms.
It provides automatic PDF, Word, PowerPoint, TXT and CSV parsing and chunking with cosine similarity.
Key security features: Enterprise RLS policies, thread-level isolation, and lazy thread creation.`;

  const base64Data = Buffer.from(docContent, 'utf8').toString('base64');

  const uploadRes = await fetch('http://127.0.0.1:3001/api/rag/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: 'netroot_specs.txt',
      mimeType: 'text/plain',
      fileData: base64Data,
      thread_id: 'test-thread-99',
      workspace_id: 'default'
    }),
  });

  const uploadResult = await uploadRes.json();
  console.log('Upload result:', uploadResult.success ? 'SUCCESS' : uploadResult);

  // 3. Test chat with RAG context
  const chatRes = await fetch('http://127.0.0.1:3001/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'What embedding model does Netroot AI use and what is its CPU latency?',
      threadId: 'test-thread-99',
      model: 'openai/gpt-oss-20b',
    })
  });

  const chatData = await chatRes.json();
  console.log('Chat response status:', chatRes.status);
  console.log('Chat citations:', chatData.citations);
  console.log('Chat answer snippet:', (chatData.answer || '').slice(0, 250));
}

testRAGFlow().catch(console.error);
