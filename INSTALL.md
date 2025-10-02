# HamLogger Installation Guide / HamLogger Telepítési Útmutató

## English

### System Requirements

- **Operating System**: Windows 10/11 (64-bit) or Linux (Ubuntu 18.04+, or equivalent)
- **RAM**: Minimum 4 GB
- **Storage**: Minimum 500 MB free space
- **Internet Connection**: Required for QRZ.com, DX cluster, and weather data

### Windows Installation

#### 1. Install HamLogger

1. Download the latest Windows version from the [Releases](https://github.com/your-repo/hamlogger/releases) page
2. Run the `HamLogger_x.x.x_windows_x64.exe` installer
3. Follow the installation wizard instructions
4. Launch HamLogger after installation

#### 2. Install Hamlib (for CAT Control)

If you want to use CAT control functionality (radio control), you need to install Hamlib:

##### 2.1. Download Hamlib

1. Visit the [Hamlib official snapshots page](https://hamlib.sourceforge.net/snapshots/)
2. Download the latest **stable Win64** version (e.g., `hamlib-w64-4.5.5.zip`)
3. Extract the ZIP file to a temporary location

##### 2.2. Install Hamlib

1. Create a folder: `C:\Program Files\Hamlib`
2. Copy all contents from the extracted ZIP to `C:\Program Files\Hamlib`
3. The `rigctld.exe` should be located at: `C:\Program Files\Hamlib\bin\rigctld.exe`

##### 2.3. Add Hamlib to System PATH

1. Press `Win + R`, type `sysdm.cpl`, and press Enter
2. Click on the **Advanced** tab
3. Click **Environment Variables**
4. In the **System Variables** section, find and select **Path**, then click **Edit**
5. Click **New** and add: `C:\Program Files\Hamlib\bin`
6. Click **OK** on all dialogs
7. Restart your computer or log out and back in

##### 2.4. Verify Installation

1. Open Command Prompt (`Win + R`, type `cmd`, press Enter)
2. Type `rigctld --version` and press Enter
3. You should see the Hamlib version information

#### 3. Configure HamLogger

1. Launch HamLogger
2. Go through the Setup Wizard
3. When asked about CAT Control, check "Enable CAT Control"
4. Enter `rigctld` as the rigctld path (since it's now in your PATH)

### Linux Installation

#### 1. Install HamLogger

##### Option A: Download Pre-built Package

1. Download the appropriate package from [Releases](https://github.com/your-repo/hamlogger/releases):
   - `.deb` for Ubuntu/Debian
   - `.rpm` for Fedora/CentOS/RHEL
   - `.AppImage` for universal Linux

##### Option B: Install .deb Package (Ubuntu/Debian)

```bash
sudo dpkg -i HamLogger_x.x.x_linux_x64.deb
sudo apt-get install -f  # Fix any dependency issues
```

##### Option C: Install .rpm Package (Fedora/CentOS/RHEL)

```bash
sudo rpm -i HamLogger_x.x.x_linux_x64.rpm
```

##### Option D: Run AppImage

```bash
chmod +x HamLogger_x.x.x_linux_x64.AppImage
./HamLogger_x.x.x_linux_x64.AppImage
```

#### 2. Install Hamlib (for CAT Control)

##### Ubuntu/Debian:

```bash
sudo apt update
sudo apt install libhamlib-utils
```

##### Fedora:

```bash
sudo dnf install hamlib
```

##### CentOS/RHEL:

```bash
sudo yum install hamlib
# or for newer versions:
sudo dnf install hamlib
```

##### Arch Linux:

```bash
sudo pacman -S hamlib
```

#### 3. Verify Hamlib Installation

```bash
rigctld --version
```

#### 4. Configure HamLogger

1. Launch HamLogger
2. Go through the Setup Wizard
3. When asked about CAT Control, check "Enable CAT Control"
4. Enter `rigctld` as the rigctld path

### Troubleshooting

#### Windows

- **"rigctld is not recognized"**: Make sure Hamlib is properly installed and added to PATH
- **Permission errors**: Run Command Prompt as Administrator when testing
- **Antivirus blocking**: Add Hamlib folder to antivirus exceptions

#### Linux

- **Permission denied for serial ports**: Add your user to the `dialout` group:
  ```bash
  sudo usermod -a -G dialout $USER
  ```
  Then log out and back in.

- **rigctld not found**: Make sure Hamlib is installed using your distribution's package manager

---

## Magyar

### Rendszerkövetelmények

- **Operációs rendszer**: Windows 10/11 (64-bit) vagy Linux (Ubuntu 18.04+, vagy egyenértékű)
- **RAM**: Minimum 4 GB
- **Tárhely**: Minimum 500 MB szabad hely
- **Internetkapcsolat**: Szükséges a QRZ.com, DX cluster és időjárás adatok lekéréséhez

### Windows Telepítés

#### 1. HamLogger Telepítése

1. Töltsd le a legújabb Windows verziót a [Releases](https://github.com/your-repo/hamlogger/releases) oldalról
2. Futtasd a `HamLogger_x.x.x_windows_x64.exe` telepítőt
3. Kövesd a telepítő varázsló utasításait
4. Indítsd el a HamLogger-t a telepítés után

#### 2. Hamlib Telepítése (CAT Vezérléshez)

Ha szeretnéd használni a CAT vezérlés funkciót (rádió vezérlés), telepítened kell a Hamlib-et:

##### 2.1. Hamlib Letöltése

1. Látogass el a [Hamlib hivatalos snapshots oldalára](https://hamlib.sourceforge.net/snapshots/)
2. Töltsd le a legújabb **stabil Win64** verziót (pl. `hamlib-w64-4.5.5.zip`)
3. Csomagold ki a ZIP fájlt egy ideiglenes helyre

##### 2.2. Hamlib Telepítése

1. Hozz létre egy mappát: `C:\Program Files\Hamlib`
2. Másold át az összes tartalmat a kicsomagolt ZIP-ből a `C:\Program Files\Hamlib` mappába
3. A `rigctld.exe` a következő helyen kell legyen: `C:\Program Files\Hamlib\bin\rigctld.exe`

##### 2.3. Hamlib Hozzáadása a Rendszer PATH-hoz

1. Nyomd meg a `Win + R` billentyűket, írd be: `sysdm.cpl`, majd nyomd meg az Enter-t
2. Kattints a **Speciális** fülre
3. Kattints a **Környezeti változók** gombra
4. A **Rendszerváltozók** részben keresd meg és válaszd ki a **Path** változót, majd kattints a **Szerkesztés** gombra
5. Kattints az **Új** gombra és add hozzá: `C:\Program Files\Hamlib\bin`
6. Kattints az **OK** gombra minden párbeszédablakban
7. Indítsd újra a számítógépet vagy jelentkezz ki és vissza

##### 2.4. Telepítés Ellenőrzése

1. Nyisd meg a Parancssort (`Win + R`, írd be: `cmd`, nyomd meg az Enter-t)
2. Írd be: `rigctld --version` és nyomd meg az Enter-t
3. Látnod kell a Hamlib verzióinformációit

#### 3. HamLogger Konfigurálása

1. Indítsd el a HamLogger-t
2. Menj végig a Beállítási Varázslón
3. Amikor a CAT Vezérlésről kérdez, jelöld be az "Enable CAT Control" opciót
4. Írd be a `rigctld` értéket a rigctld útvonalként (mivel már a PATH-ban van)

### Linux Telepítés

#### 1. HamLogger Telepítése

##### A opció: Előre Lefordított Csomag Letöltése

1. Töltsd le a megfelelő csomagot a [Releases](https://github.com/your-repo/hamlogger/releases) oldalról:
   - `.deb` Ubuntu/Debian-hoz
   - `.rpm` Fedora/CentOS/RHEL-hez
   - `.AppImage` univerzális Linux-hoz

##### B opció: .deb Csomag Telepítése (Ubuntu/Debian)

```bash
sudo dpkg -i HamLogger_x.x.x_linux_x64.deb
sudo apt-get install -f  # Függőségi problémák javítása
```

##### C opció: .rpm Csomag Telepítése (Fedora/CentOS/RHEL)

```bash
sudo rpm -i HamLogger_x.x.x_linux_x64.rpm
```

##### D opció: AppImage Futtatása

```bash
chmod +x HamLogger_x.x.x_linux_x64.AppImage
./HamLogger_x.x.x_linux_x64.AppImage
```

#### 2. Hamlib Telepítése (CAT Vezérléshez)

##### Ubuntu/Debian:

```bash
sudo apt update
sudo apt install libhamlib-utils
```

##### Fedora:

```bash
sudo dnf install hamlib
```

##### CentOS/RHEL:

```bash
sudo yum install hamlib
# vagy újabb verziókhoz:
sudo dnf install hamlib
```

##### Arch Linux:

```bash
sudo pacman -S hamlib
```

#### 3. Hamlib Telepítés Ellenőrzése

```bash
rigctld --version
```

#### 4. HamLogger Konfigurálása

1. Indítsd el a HamLogger-t
2. Menj végig a Beállítási Varázslón
3. Amikor a CAT Vezérlésről kérdez, jelöld be az "Enable CAT Control" opciót
4. Írd be a `rigctld` értéket a rigctld útvonalként

### Hibaelhárítás

#### Windows

- **"rigctld is not recognized" hiba**: Győződj meg róla, hogy a Hamlib megfelelően telepítve van és hozzá van adva a PATH-hoz
- **Jogosultsági hibák**: Futtasd a Parancssort rendszergazdaként teszteléskor
- **Vírusirtó blokkolja**: Add hozzá a Hamlib mappát a vírusirtó kivételeihez

#### Linux

- **Jogosultság megtagadva soros portokhoz**: Add hozzá a felhasználódat a `dialout` csoporthoz:
  ```bash
  sudo usermod -a -G dialout $USER
  ```
  Majd jelentkezz ki és vissza.

- **rigctld nem található**: Győződj meg róla, hogy a Hamlib telepítve van a disztribúciód csomagkezelőjével
