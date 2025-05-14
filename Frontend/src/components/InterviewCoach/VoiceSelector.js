import React, { useState, useEffect } from 'react';

const VoiceSelector = ({ selectedVoice, onChange, className }) => {
  const [availableVoices, setAvailableVoices] = useState([]);
  const [voiceLoading, setVoiceLoading] = useState(true);

  // Load available voices
  useEffect(() => {
    let voicesLoaded = false;
    
    const loadVoices = () => {
      // Force initialization of the speech synthesis
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      
      const synth = window.speechSynthesis;
      let voices = synth.getVoices();
      
      // In some browsers, getVoices() might return an empty array on first call
      if (voices.length === 0) {
        setTimeout(() => {
          voices = synth.getVoices();
          if (voices.length > 0) {
            setAvailableVoices(voices);
            setVoiceLoading(false);
            voicesLoaded = true;
          }
        }, 100);
        return;
      }
      
      if (voices.length > 0 && !voicesLoaded) {
        setAvailableVoices(voices);
        setVoiceLoading(false);
        voicesLoaded = true;
        
        // Log available voices for debugging
        console.log('Loaded voices:', voices.map(v => `${v.name} (${v.lang})`));
      }
    };
    
    // Call immediately to attempt first load
    loadVoices();
    
    // The voiceschanged event is fired when the list of voices is populated or changes
    if ('onvoiceschanged' in window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    } else {
      // For browsers that don't reliably fire the voiceschanged event
      setTimeout(loadVoices, 500);
    }
    
    return () => {
      // Clean up speech synthesis on unmount
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Play sample of the selected voice
  const handleVoicePreview = () => {
    if (!selectedVoice) return;
    
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance("Hello, I'll be your interviewer today.");
    
    // Find the selected voice
    const voiceObject = availableVoices.find(voice => voice.voiceURI === selectedVoice);
    
    if (voiceObject) {
      utterance.voice = voiceObject;
      synth.speak(utterance);
    }
  };

  // Group voices by language and sort them
  const groupedVoices = availableVoices.reduce((groups, voice) => {
    const lang = voice.lang.split('-')[0].toLowerCase();
    
    // Try to get language name with fallback for browsers without Intl.DisplayNames
    let langName;
    try {
      langName = typeof Intl !== 'undefined' && 'DisplayNames' in Intl 
        ? new Intl.DisplayNames(['en'], { type: 'language' }).of(lang) 
        : null;
    } catch (e) {
      langName = null;
    }
    
    // Fallback to predefined language names if Intl.DisplayNames is not available
    if (!langName) {
      const langMap = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'ru': 'Russian',
        'ja': 'Japanese',
        'ko': 'Korean',
        'zh': 'Chinese',
        'ar': 'Arabic',
        'hi': 'Hindi',
        'nl': 'Dutch',
        'sv': 'Swedish',
        'fi': 'Finnish',
        'no': 'Norwegian',
        'da': 'Danish',
        'pl': 'Polish',
        'tr': 'Turkish',
        'th': 'Thai'
      };
      langName = langMap[lang] || lang.toUpperCase();
    }
    
    if (!groups[langName]) {
      groups[langName] = [];
    }
    
    groups[langName].push(voice);
    return groups;
  }, {});

  // Sort language groups alphabetically
  const sortedLanguages = Object.keys(groupedVoices).sort();
  
  // Ensure English is first if available
  if (sortedLanguages.includes('English')) {
    sortedLanguages.splice(sortedLanguages.indexOf('English'), 1);
    sortedLanguages.unshift('English');
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <select
          value={selectedVoice || ''}
          onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
          className="flex-1 p-3 border border-gray-300 rounded-md"
          disabled={voiceLoading || availableVoices.length === 0}
        >
          <option value="">Default Voice</option>
          {sortedLanguages.map(language => (
            <optgroup key={language} label={language}>
              {groupedVoices[language]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(voice => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>
                    {voice.name} {voice.lang.includes('-') ? `(${voice.lang.split('-')[1]})` : ''}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        <button
          type="button"
          onClick={handleVoicePreview}
          disabled={!selectedVoice || voiceLoading}
          className="px-4 py-3 bg-navy text-white rounded-md hover:bg-opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Preview
        </button>
      </div>
      {voiceLoading ? (
        <p className="text-sm text-gray-500 mt-1">Loading voices...</p>
      ) : availableVoices.length === 0 ? (
        <p className="text-sm text-red-500 mt-1">Your browser doesn't support voice selection</p>
      ) : (
        <p className="text-sm text-gray-500 mt-1">
          Select a voice for your interviewer and click Preview to hear it
          {availableVoices.length < 5 && (
            <>
              <br />
              <span className="italic text-xs">Note: Different browsers and devices may have different voice options available</span>
            </>
          )}
        </p>
      )}
    </div>
  );
};

export default VoiceSelector; 