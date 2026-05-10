(() => {
  const chunks = window.FAILURE_ATLAS_DATA_CHUNKS || [];
  if (!chunks.length || chunks.some((chunk) => typeof chunk !== 'string')) {
    throw new Error('Failure Atlas data chunks did not load correctly.');
  }
  window.FAILURE_ATLAS_DATA = JSON.parse(chunks.join(''));
  delete window.FAILURE_ATLAS_DATA_CHUNKS;
})();
