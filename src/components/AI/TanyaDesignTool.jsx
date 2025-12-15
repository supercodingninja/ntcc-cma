import React, { useState, useEffect } from 'react';
import { X, Minimize2, Maximize2, Palette, Type, Layout, Zap, Save, Eye, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  colorThemes,
  fontPairings,
  spacingScales,
  borderStyles,
  componentStyles,
  animationPresets,
  defaultDesignConfig
} from '../../data/design-templates';
import {
  saveModalState,
  loadModalState,
  AI_MODAL_STORAGE_KEYS
} from '../../utils/ai-modal-state';

const TanyaDesignTool = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('colors');
  const [config, setConfig] = useState(defaultDesignConfig);
  const [savedConfigs, setSavedConfigs] = useState([]);
  const [configName, setConfigName] = useState('My Design');
  const [isMinimized, setIsMinimized] = useState(() => loadModalState(AI_MODAL_STORAGE_KEYS.TANYA_STATE).isMinimized);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    saveModalState(AI_MODAL_STORAGE_KEYS.TANYA_STATE, { isMinimized });
  }, [isMinimized]);

  useEffect(() => {
    if (isOpen) {
      loadConfigs();
      loadActiveConfig();
    }
  }, [isOpen]);

  const loadConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('design_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedConfigs(data || []);
    } catch (error) {
      console.error('Error loading configs:', error);
    }
  };

  const loadActiveConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('design_configs')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setConfig({
          colorTheme: data.color_theme,
          fontPairing: data.font_pairing,
          spacingScale: data.spacing_scale,
          borderStyle: data.border_style,
          cardStyle: data.card_style,
          buttonStyle: data.button_style,
          animation: data.animation,
          darkMode: data.dark_mode
        });
      }
    } catch (error) {
      console.error('Error loading active config:', error);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('design_configs')
        .insert({
          user_id: user?.id,
          config_name: configName,
          is_active: false,
          color_theme: config.colorTheme,
          font_pairing: config.fontPairing,
          spacing_scale: config.spacingScale,
          border_style: config.borderStyle,
          card_style: config.cardStyle,
          button_style: config.buttonStyle,
          animation: config.animation,
          dark_mode: config.darkMode
        });

      if (error) throw error;

      setMessage('Design saved successfully!');
      loadConfigs();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage('Error saving design');
    } finally {
      setIsSaving(false);
    }
  };

  const applyConfig = async (configId) => {
    try {
      await supabase
        .from('design_configs')
        .update({ is_active: false })
        .neq('id', configId);

      const { error } = await supabase
        .from('design_configs')
        .update({ is_active: true })
        .eq('id', configId);

      if (error) throw error;

      setMessage('Design applied! Reload the page to see changes.');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error applying config:', error);
      setMessage('Error applying design');
    }
  };

  const resetToDefault = () => {
    setConfig(defaultDesignConfig);
    setMessage('Reset to default design');
    setTimeout(() => setMessage(''), 3000);
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-24 z-[9999] bg-gradient-to-r from-pink-500 to-rose-600 text-white px-6 py-4 rounded-full shadow-2xl hover:shadow-3xl hover:scale-105 transition-all flex items-center gap-3"
      >
        <Palette className="w-5 h-5" />
        <span className="font-semibold">Tanya</span>
        <Maximize2 className="w-5 h-5" />
      </button>
    );
  }

  const selectedTheme = colorThemes[config.colorTheme];
  const selectedFontPairing = fontPairings[config.fontPairing];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 max-w-6xl w-full h-[90vh] flex rounded-2xl shadow-2xl overflow-hidden">
        <div className="w-64 bg-gradient-to-b from-pink-50 to-rose-50 dark:from-gray-800 dark:to-gray-900 p-6 border-r border-pink-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Palette className="w-6 h-6 text-pink-600" />
              Tanya
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setIsMinimized(true)}
                className="text-gray-600 hover:bg-pink-100 p-2 rounded-lg transition-all"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="text-gray-600 hover:bg-pink-100 p-2 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'colors', icon: Palette, label: 'Colors' },
              { id: 'typography', icon: Type, label: 'Typography' },
              { id: 'layout', icon: Layout, label: 'Layout & Spacing' },
              { id: 'components', icon: Zap, label: 'Components' },
              { id: 'saved', icon: Save, label: 'Saved Designs' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-pink-100 dark:hover:bg-gray-800'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-8 space-y-3">
            <button
              onClick={saveConfig}
              disabled={isSaving}
              className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
            >
              <Save className="w-5 h-5 inline mr-2" />
              {isSaving ? 'Saving...' : 'Save Design'}
            </button>
            <button
              onClick={resetToDefault}
              className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 transition-all"
            >
              <RefreshCw className="w-5 h-5 inline mr-2" />
              Reset to Default
            </button>
          </div>

          {message && (
            <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded-lg text-sm">
              {message}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'colors' && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Color Theme</h3>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {Object.entries(colorThemes).map(([key, theme]) => (
                  <button
                    key={key}
                    onClick={() => setConfig({ ...config, colorTheme: key })}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      config.colorTheme === key
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'
                    }`}
                  >
                    <h4 className="font-bold text-gray-900 dark:text-white mb-3">{theme.name}</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-12 rounded" style={{ backgroundColor: theme.primary }}></div>
                      <div className="h-12 rounded" style={{ backgroundColor: theme.secondary }}></div>
                      <div className="h-12 rounded" style={{ backgroundColor: theme.accent }}></div>
                    </div>
                  </button>
                ))}
              </div>

              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Current Theme Colors</h4>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(selectedTheme).filter(([key]) => key !== 'name').map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-2">
                    <div className="h-20 rounded-lg border-2 border-gray-200" style={{ backgroundColor: value }}></div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{key}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'typography' && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Typography</h3>

              <div className="space-y-4">
                {Object.entries(fontPairings).map(([key, fonts]) => (
                  <button
                    key={key}
                    onClick={() => setConfig({ ...config, fontPairing: key })}
                    className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
                      config.fontPairing === key
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'
                    }`}
                  >
                    <h4 className="font-bold text-gray-900 dark:text-white mb-4">{fonts.name}</h4>
                    <p className="text-3xl mb-2" style={{ fontFamily: fonts.heading }}>
                      Heading Example
                    </p>
                    <p className="text-base text-gray-600 dark:text-gray-400" style={{ fontFamily: fonts.body }}>
                      Body text example with comfortable reading flow
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'layout' && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Layout & Spacing</h3>

              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Spacing Scale</h4>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {Object.entries(spacingScales).map(([key, scale]) => (
                  <button
                    key={key}
                    onClick={() => setConfig({ ...config, spacingScale: key })}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${
                      config.spacingScale === key
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'
                    }`}
                  >
                    <h5 className="font-bold text-gray-900 dark:text-white mb-2">{scale.name}</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Scale: {scale.scale}x</p>
                  </button>
                ))}
              </div>

              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Border Style</h4>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(borderStyles).map(([key, style]) => (
                  <button
                    key={key}
                    onClick={() => setConfig({ ...config, borderStyle: key })}
                    className={`p-6 border-2 transition-all ${
                      config.borderStyle === key
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'
                    }`}
                    style={{ borderRadius: style.cardRadius }}
                  >
                    <h5 className="font-bold text-gray-900 dark:text-white">{style.name}</h5>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'components' && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Component Styles</h3>

              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Card Style</h4>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {componentStyles.cards.map(card => (
                  <button
                    key={card.id}
                    onClick={() => setConfig({ ...config, cardStyle: card.id })}
                    className={`p-6 rounded-xl transition-all ${card.shadow} ${card.border} ${
                      config.cardStyle === card.id
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 hover:border-pink-300'
                    }`}
                  >
                    <h5 className="font-bold text-gray-900">{card.name}</h5>
                  </button>
                ))}
              </div>

              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Button Style</h4>
              <div className="grid grid-cols-2 gap-4">
                {componentStyles.buttons.map(button => (
                  <button
                    key={button.id}
                    onClick={() => setConfig({ ...config, buttonStyle: button.id })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      config.buttonStyle === button.id
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 hover:border-pink-300'
                    }`}
                  >
                    <div className={`px-6 py-3 rounded-lg ${button.style}`}>
                      {button.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'saved' && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Saved Designs</h3>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Design Name
                </label>
                <input
                  type="text"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  placeholder="My Custom Design"
                />
              </div>

              <div className="space-y-3">
                {savedConfigs.map(saved => (
                  <div
                    key={saved.id}
                    className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-pink-300 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-bold text-gray-900 dark:text-white">{saved.config_name}</h5>
                      {saved.is_active && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {colorThemes[saved.color_theme]?.name} • {fontPairings[saved.font_pairing]?.name}
                    </p>
                    <button
                      onClick={() => applyConfig(saved.id)}
                      className="w-full px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                    >
                      <Eye className="w-4 h-4 inline mr-2" />
                      Apply This Design
                    </button>
                  </div>
                ))}

                {savedConfigs.length === 0 && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No saved designs yet. Customize your design and click "Save Design" to save it.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TanyaDesignTool;
