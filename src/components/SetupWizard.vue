<script lang="ts">
import { CallsignHelper } from '../utils/callsign';
import { BAND_RANGES } from '../utils/bands';
import defaultSettings from '../settings.json';

interface WizardData {
  callsign: string;
  qth: string;
  locator: string;
  iaruRegion: 'IARU1' | 'IARU2' | 'IARU3';
  selectedBands: string[];
  importAdif: boolean;
  enableCat: boolean;
  rigctldPath: string;
}

export default {
  name: 'SetupWizard',
  emits: ['complete'],
  data() {
    return {
      currentStep: 1,
      totalSteps: 5,
      wizardData: {
        callsign: '',
        qth: '',
        locator: '',
        iaruRegion: 'IARU1',
        selectedBands: ['80', '40', '20', '15', '10'], // Default HF bands
        importAdif: false,
        enableCat: false,
        rigctldPath: 'rigctld',
      } as WizardData,
      isValidating: false,
      validationErrors: {} as Record<string, string>,
      importStatus: {
        isImporting: false,
        importedCount: 0,
        totalCount: 0,
        error: null as string | null,
        success: false,
      },
      availableBands: BAND_RANGES.filter(band =>
        ['160', '80', '60', '40', '30', '20', '17', '15', '12', '10', '6', '2', '70'].includes(
          band.shortName
        )
      ),
      isWindows: navigator.platform.toLowerCase().includes('win'),
      isLinux: navigator.platform.toLowerCase().includes('linux'),
    };
  },
  computed: {
    canProceed() {
      switch (this.currentStep) {
        case 1:
          return (
            this.wizardData.callsign.trim() !== '' &&
            this.wizardData.qth.trim() !== '' &&
            !this.validationErrors.callsign
          );
        case 2:
          return !this.validationErrors.locator;
        case 3:
          return this.wizardData.selectedBands.length > 0;
        case 4:
          return !this.importStatus.isImporting; // Disable if import is running
        case 5:
          return (
            !this.wizardData.enableCat ||
            (this.wizardData.rigctldPath.trim() !== '' && !this.validationErrors.rigctldPath)
          );
        default:
          return false;
      }
    },
    isLastStep() {
      return this.currentStep === this.totalSteps;
    },
  },
  methods: {
    nextStep() {
      if (this.canProceed) {
        if (this.isLastStep) {
          this.completeSetup();
        } else {
          this.currentStep++;
        }
      }
    },
    handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.nextStep();
      }
    },
    prevStep() {
      if (this.currentStep > 1) {
        this.currentStep--;
      }
    },
    validateCallsign() {
      const callsign = this.wizardData.callsign.trim().toUpperCase();
      if (!callsign) {
        this.validationErrors.callsign = 'Callsign is required';
        return false;
      }

      if (!CallsignHelper.isValidCallsign(callsign)) {
        this.validationErrors.callsign = 'Invalid callsign format';
        return false;
      }

      delete this.validationErrors.callsign;
      this.wizardData.callsign = callsign;
      return true;
    },
    validateLocator() {
      const locator = this.wizardData.locator.trim().toUpperCase();
      if (locator && locator.length >= 4) {
        const locatorRegex = /^[A-R]{2}[0-9]{2}([A-X]{2})?([0-9]{2})?$/;
        if (!locatorRegex.test(locator)) {
          this.validationErrors.locator = 'Invalid locator format (e.g. JN97)';
          return false;
        }
      }

      delete this.validationErrors.locator;
      this.wizardData.locator = locator;
      return true;
    },
    async testRigctldPath() {
      if (!this.wizardData.enableCat) {
        delete this.validationErrors.rigctldPath;
        return true;
      }

      this.isValidating = true;
      try {
        const result = await window.electronAPI.executeCommand(
          `which ${this.wizardData.rigctldPath}`
        );
        if (result.success && result.data.trim()) {
          delete this.validationErrors.rigctldPath;
          return true;
        } else {
          this.validationErrors.rigctldPath = 'rigctld not found in the specified path';
          return false;
        }
      } catch {
        this.validationErrors.rigctldPath = 'Error checking rigctld path';
        return false;
      } finally {
        this.isValidating = false;
      }
    },
    toggleBand(bandShortName: string) {
      const index = this.wizardData.selectedBands.indexOf(bandShortName);
      if (index > -1) {
        this.wizardData.selectedBands.splice(index, 1);
      } else {
        this.wizardData.selectedBands.push(bandShortName);
      }
    },
    selectAllHFBands() {
      const hfBands = ['160', '80', '60', '40', '30', '20', '17', '15', '12', '10'];
      this.wizardData.selectedBands = [...hfBands];
    },
    selectAllVHFUHFBands() {
      const vhfUhfBands = ['6', '2', '70'];
      this.wizardData.selectedBands = [
        ...this.wizardData.selectedBands,
        ...vhfUhfBands.filter(band => !this.wizardData.selectedBands.includes(band)),
      ];
    },
    clearAllBands() {
      this.wizardData.selectedBands = [];
    },
    forceUppercaseCallsign(event: Event) {
      const target = event.target as HTMLInputElement;
      const cursorPosition = target.selectionStart;
      this.wizardData.callsign = target.value.toUpperCase();
      // Restore cursor position after Vue updates the input
      this.$nextTick(() => {
        target.setSelectionRange(cursorPosition, cursorPosition);
      });
    },
    async selectAndImportAdifFile() {
      this.importStatus.isImporting = true;
      this.importStatus.error = null;
      this.importStatus.success = false;
      this.importStatus.importedCount = 0;
      this.importStatus.totalCount = 0;

      try {
        // First, let user select the file
        const fileResult = await window.electronAPI.selectAdifFile();
        if (!fileResult.success || !fileResult.filePath) {
          this.importStatus.isImporting = false;
          return;
        }

        // Parse the file to get total count
        const parseResult = await window.electronAPI.parseAdifFile(fileResult.filePath);
        if (!parseResult.success) {
          this.importStatus.error = parseResult.error || 'Failed to parse ADIF file';
          this.importStatus.isImporting = false;
          return;
        }

        this.importStatus.totalCount = parseResult.totalCount || 0;

        // Listen for progress updates BEFORE starting import
        window.electronAPI.onAdifImportProgress((progress) => {
          this.importStatus.importedCount = progress.imported;
        });

        // Import with progress updates
        const importResult = await window.electronAPI.importAdifWithProgress(fileResult.filePath);

        if (importResult.success) {
          this.importStatus.success = true;
          this.importStatus.importedCount = importResult.count || 0;
          console.log(`Successfully imported ${importResult.count} QSOs from ADIF file`);
        } else {
          this.importStatus.error = importResult.error || 'Import failed';
        }
      } catch (error) {
        console.error('Error importing ADIF:', error);
        this.importStatus.error = 'An unexpected error occurred during import';
      } finally {
        this.importStatus.isImporting = false;
      }
    },
    async importAdifFile() {
      try {
        const result = await window.electronAPI.importAdif();
        if (result.imported) {
          console.log(`Successfully imported ${result.count} QSOs from ADIF file`);
          return true;
        } else {
          console.error('ADIF import failed:', result.error);
          return false;
        }
      } catch (error) {
        console.error('Error importing ADIF:', error);
        return false;
      }
    },
    async copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text);
        // Optional: Show a brief success indication
        console.log('Command copied to clipboard:', text);
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        // Fallback: select the text for manual copying
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    },
    async completeSetup() {
      // Validate all fields
      const isCallsignValid = this.validateCallsign();
      const isLocatorValid = this.validateLocator();
      const isRigctldValid = await this.testRigctldPath();

      if (!isCallsignValid || !isLocatorValid || !isRigctldValid) {
        return;
      }

      // Create settings object by copying the structure from defaultSettings
      const settings = {
        ...defaultSettings,
        station: {
          ...defaultSettings.station,
          callsign: this.wizardData.callsign,
          qth: this.wizardData.qth,
          grid: this.wizardData.locator,
          iaruRegion: this.wizardData.iaruRegion,
          selectedBands: [...this.wizardData.selectedBands],
        },
        rig: {
          ...defaultSettings.rig,
          enabled: this.wizardData.enableCat,
          rigctldPath: this.wizardData.enableCat
            ? this.wizardData.rigctldPath
            : defaultSettings.rig.rigctldPath || 'rigctld',
        },
      };

      try {
        // Save settings first
        await window.electronAPI.saveSettings(settings);

        // Import ADIF if requested and not already imported
        if (this.wizardData.importAdif && !this.importStatus.success) {
          await this.importAdifFile();
        }

        this.$emit('complete');
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    },
  },
};
</script>

<template>
  <div class="wizard-overlay" @keydown="handleKeydown">
    <div class="wizard-container">
      <div class="wizard-header">
        <h1>HamLogger Initial Setup</h1>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
          ></div>
        </div>
        <p class="step-indicator">Step {{ currentStep }} of {{ totalSteps }}</p>
        <div class="hint-box">
          <p class="hint-text">
            💡 <strong>Tip:</strong> All settings can be changed later in the Configuration menu.
          </p>
        </div>
      </div>

      <div class="wizard-content">
        <!-- Step 1: Basic Station Info -->
        <div v-if="currentStep === 1" class="wizard-step">
          <h2>Station Information</h2>
          <p class="step-description">Please enter your basic station information.</p>

          <div class="form-group">
            <label for="callsign">Callsign *</label>
            <input
              id="callsign"
              v-model="wizardData.callsign"
              type="text"
              placeholder="e.g. HA5XB"
              @input="forceUppercaseCallsign"
              @blur="validateCallsign"
              :class="{ error: validationErrors.callsign }"
            />
            <span v-if="validationErrors.callsign" class="error-message">
              {{ validationErrors.callsign }}
            </span>
          </div>

          <div class="form-group">
            <label for="qth">QTH (Location) *</label>
            <input
              id="qth"
              v-model="wizardData.qth"
              type="text"
              placeholder="e.g. Budapest, Hungary"
            />
          </div>
        </div>

        <!-- Step 2: Optional Info -->
        <div v-if="currentStep === 2" class="wizard-step">
          <h2>Additional Information</h2>
          <p class="step-description">
            These fields are optional but help improve the program's functionality.
          </p>

          <div class="form-group">
            <label for="locator">Maidenhead Locator</label>
            <input
              id="locator"
              v-model="wizardData.locator"
              type="text"
              placeholder="e.g. JN97"
              @blur="validateLocator"
              :class="{ error: validationErrors.locator }"
            />
            <span v-if="validationErrors.locator" class="error-message">
              {{ validationErrors.locator }}
            </span>
          </div>

          <div class="form-group">
            <label for="iaruRegion">IARU Region</label>
            <select id="iaruRegion" v-model="wizardData.iaruRegion">
              <option value="IARU1">
                IARU Region 1 (Europe, Africa, Middle East, Northern Asia)
              </option>
              <option value="IARU2">IARU Region 2 (Americas)</option>
              <option value="IARU3">IARU Region 3 (Asia-Pacific)</option>
            </select>
          </div>
        </div>

        <!-- Step 3: Band Selection -->
        <div v-if="currentStep === 3" class="wizard-step">
          <h2>Band Selection</h2>
          <p class="step-description">
            Select the amateur radio bands you plan to operate on. This helps optimize the interface
            for your needs.
          </p>

          <div class="band-selection-controls">
            <button type="button" @click="selectAllHFBands" class="btn btn-small">All HF</button>
            <button type="button" @click="selectAllVHFUHFBands" class="btn btn-small">
              VHF/UHF
            </button>
            <button type="button" @click="clearAllBands" class="btn btn-small">Clear All</button>
          </div>

          <div class="band-grid">
            <label v-for="band in availableBands" :key="band.shortName" class="band-checkbox">
              <input
                type="checkbox"
                :value="band.shortName"
                :checked="wizardData.selectedBands.includes(band.shortName)"
                @change="toggleBand(band.shortName)"
              />
              <span class="band-label">{{ band.name }} ({{ band.shortName }}m)</span>
            </label>
          </div>

          <div v-if="wizardData.selectedBands.length === 0" class="warning-message">
            Please select at least one band to continue.
          </div>
        </div>

        <!-- Step 4: ADIF Import -->
        <div v-if="currentStep === 4" class="wizard-step">
          <h2>Import Existing Log</h2>
          <p class="step-description">
            Do you have an existing ADIF log file you'd like to import?
          </p>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="wizardData.importAdif" />
              Import ADIF file
            </label>
          </div>

          <div v-if="wizardData.importAdif" class="import-section">
            <div class="info-box">
              <p class="info-text">
                Select your ADIF file (.adi or .adif) to import your existing QSO records.
              </p>
            </div>

            <div class="import-controls">
              <button 
                type="button" 
                @click="selectAndImportAdifFile" 
                :disabled="importStatus.isImporting"
                class="btn btn-primary import-btn"
              >
                <span v-if="!importStatus.isImporting">Select & Import ADIF File</span>
                <span v-else class="loading-text">
                  <span class="spinner"></span>
                  Importing...
                </span>
              </button>
            </div>

            <!-- Import Progress -->
            <div v-if="importStatus.isImporting" class="import-progress">
              <div class="progress-info">
                <span class="progress-text">
                  Imported {{ importStatus.importedCount }} 
                  <span v-if="importStatus.totalCount > 0">of {{ importStatus.totalCount }}</span>
                  QSOs
                </span>
              </div>
              <div class="progress-bar-container">
                <div 
                  class="progress-bar-fill" 
                  :style="{ 
                    width: importStatus.totalCount > 0 
                      ? `${(importStatus.importedCount / importStatus.totalCount) * 100}%` 
                      : '0%' 
                  }"
                ></div>
              </div>
            </div>

            <!-- Import Success -->
            <div v-if="importStatus.success && !importStatus.isImporting" class="success-message">
              ✅ Successfully imported {{ importStatus.importedCount }} QSOs!
            </div>

            <!-- Import Error -->
            <div v-if="importStatus.error && !importStatus.isImporting" class="error-message">
              ❌ Import failed: {{ importStatus.error }}
            </div>
          </div>
        </div>

        <!-- Step 5: CAT Control -->
        <div v-if="currentStep === 5" class="wizard-step">
          <h2>CAT Control Setup</h2>
          <p class="step-description">
            Configure computer-aided transceiver control if you have a compatible radio.
          </p>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="wizardData.enableCat" />
              Enable CAT Control
            </label>
          </div>

          <!-- Windows Hamlib Warning -->
          <div v-if="wizardData.enableCat && isWindows" class="warning-box">
            <div class="warning-icon">⚠️</div>
            <div class="warning-content">
              <p class="warning-title">Windows Users</p>
              <p class="warning-text">
                On Windows, you must install Hamlib first before enabling CAT control.
                Download it from: 
                <a href="https://hamlib.sourceforge.net/snapshots/" target="_blank" class="warning-link">
                  hamlib.sourceforge.net/snapshots/
                </a>
              </p>
            </div>
          </div>

          <!-- Linux Hamlib Warning -->
          <div v-if="wizardData.enableCat && isLinux" class="warning-box">
            <div class="warning-icon">⚠️</div>
            <div class="warning-content">
              <p class="warning-title">Linux Users</p>
              <p class="warning-text">
                On Linux, you must install Hamlib first before enabling CAT control.
                (You may need sudo rights)
              </p>
              <div class="command-section">
                <p class="command-label">For Ubuntu/Debian:</p>
                <div class="command-box">
                  <code class="command-text">apt install libhamlib-utils</code>
                  <button 
                    type="button" 
                    class="copy-btn" 
                    @click="copyToClipboard('apt install libhamlib-utils')"
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                </div>
              </div>
              <div class="command-section">
                <p class="command-label">For RPM based distributions:</p>
                <div class="command-box">
                  <code class="command-text">rpm install libhamlib-utils</code>
                  <button 
                    type="button" 
                    class="copy-btn" 
                    @click="copyToClipboard('rpm install libhamlib-utils')"
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="wizardData.enableCat" class="form-group">
            <label for="rigctldPath">rigctld Path</label>
            <input
              id="rigctldPath"
              v-model="wizardData.rigctldPath"
              type="text"
              placeholder="rigctld"
              @blur="testRigctldPath"
              :class="{ error: validationErrors.rigctldPath }"
            />
            <span v-if="validationErrors.rigctldPath" class="error-message">
              {{ validationErrors.rigctldPath }}
            </span>
            <span v-if="isValidating" class="info-message"> Checking rigctld availability... </span>
            <p class="help-text">
              Enter the path to rigctld executable. If rigctld is in your PATH, just enter
              "rigctld".
            </p>
          </div>
        </div>
      </div>

      <div class="wizard-footer">
        <button v-if="currentStep > 1" @click="prevStep" class="btn btn-secondary">Previous</button>
        <button @click="nextStep" :disabled="!canProceed || isValidating" class="btn btn-primary">
          {{ isLastStep ? 'Complete Setup' : 'Next' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wizard-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.wizard-container {
  background: #333;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.wizard-header {
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid #444;
  text-align: center;
}

.wizard-header h1 {
  color: var(--main-color);
  margin: 0 0 1rem;
  font-size: 1.8rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #444;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: var(--main-color);
  transition: width 0.3s ease;
}

.step-indicator {
  color: var(--gray-color);
  margin: 0;
  font-size: 0.9rem;
}

.hint-box {
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 4px;
}

.hint-text {
  color: var(--gray-color);
  margin: 0;
  font-size: 0.85rem;
  text-align: center;
  line-height: 1.4;
}

.wizard-content {
  padding: 2rem;
  min-height: 300px;
}

.wizard-step h2 {
  color: #fff;
  margin: 0 0 0.5rem;
  font-size: 1.4rem;
}

.step-description {
  color: var(--gray-color);
  margin: 0 0 2rem;
  line-height: 1.5;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  color: var(--gray-color);
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  cursor: pointer;
}

.checkbox-label input[type='checkbox'] {
  margin-right: 0.5rem;
  width: auto;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  background: #444;
  border: 1px solid #555;
  color: #fff;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--main-color);
}

.form-group input.error {
  border-color: #e74c3c;
}

.error-message {
  color: #e74c3c;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  display: block;
}

.info-message {
  color: var(--main-color);
  font-size: 0.85rem;
  margin-top: 0.25rem;
  display: block;
}

.help-text {
  color: #666;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  line-height: 1.4;
}

.wizard-footer {
  padding: 1rem 2rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--main-color);
  color: #000;
}

.btn-primary:hover:not(:disabled) {
  background: #e6d700;
}

.btn-secondary {
  background: #555;
  color: #fff;
}

.btn-secondary:hover {
  background: #666;
}

.info-box {
  background: #2b2b2b;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 1rem;
  margin-top: 1rem;
}

.info-text {
  color: var(--gray-color);
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

.band-selection-controls {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

.band-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
  margin-top: 1rem;
}

.band-checkbox {
  display: flex !important;
  align-items: center;
  padding: 0.5rem;
  background: #2b2b2b;
  border: 1px solid #444;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.band-checkbox:hover {
  background: #3b3b3b;
}

.band-checkbox input[type='checkbox'] {
  margin-right: 0.5rem;
  width: auto;
}

.band-label {
  font-size: 0.9rem;
  color: var(--gray-color);
}

.warning-message {
  color: #e74c3c;
  font-size: 0.9rem;
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(231, 76, 60, 0.1);
  border: 1px solid rgba(231, 76, 60, 0.3);
  border-radius: 4px;
}

.import-section {
  margin-top: 1rem;
}

.import-controls {
  margin: 1rem 0;
}

.import-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 200px;
}

.loading-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.import-progress {
  margin: 1rem 0;
  padding: 1rem;
  background: #2b2b2b;
  border: 1px solid #444;
  border-radius: 4px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.progress-text {
  color: var(--main-color);
  font-weight: bold;
  font-size: 0.9rem;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background: #444;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--main-color);
  transition: width 0.3s ease;
  border-radius: 4px;
}

.success-message {
  color: #27ae60;
  font-size: 0.9rem;
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(39, 174, 96, 0.1);
  border: 1px solid rgba(39, 174, 96, 0.3);
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-message {
  color: #e74c3c;
  font-size: 0.9rem;
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(231, 76, 60, 0.1);
  border: 1px solid rgba(231, 76, 60, 0.3);
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.warning-box {
  margin: 1rem 0;
  padding: 1rem;
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 4px;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.warning-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.warning-content {
  flex: 1;
}

.warning-title {
  color: #ffc107;
  font-weight: bold;
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
}

.warning-text {
  color: var(--gray-color);
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

.warning-link {
  color: var(--main-color);
  text-decoration: none;
}

.warning-link:hover {
  text-decoration: underline;
}

.command-section {
  margin-top: 1rem;
}

.command-label {
  color: var(--gray-color);
  font-size: 0.85rem;
  margin: 0 0 0.25rem;
  font-weight: bold;
}

.command-box {
  display: flex;
  align-items: center;
  background: #2b2b2b;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
}

.command-text {
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: #fff;
  background: transparent;
  border: none;
  user-select: all;
}

.copy-btn {
  background: transparent;
  border: none;
  color: var(--main-color);
  cursor: pointer;
  padding: 0.25rem;
  margin-left: 0.5rem;
  border-radius: 2px;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.copy-btn:hover {
  background: rgba(255, 215, 0, 0.1);
}
</style>
