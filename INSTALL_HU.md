# HamLedger Installation Guide / HamLedger Telepítési Útmutató

### Rendszerkövetelmények

- **Operációs rendszer**: Windows 10/11 (64-bit) vagy Linux (Ubuntu 18.04+, vagy egyenértékű)
- **RAM**: Minimum 4 GB
- **Tárhely**: Minimum 500 MB szabad hely
- **Internetkapcsolat**: Szükséges a QRZ.com, DX cluster és időjárás adatok lekéréséhez

### Windows Telepítés

#### 1. HamLedger Telepítése

1. Töltsd le a legújabb Windows verziót a [Releases](https://github.com/valibali/hamledger/releases) oldalról
2. Futtasd a `HamLedger_x.x.x_windows_x64.exe` telepítőt
3. Kövesd a telepítő varázsló utasításait
4. Indítsd el a HamLedger-t a telepítés után

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

#### 3. HamLedger Konfigurálása

1. Indítsd el a HamLedger-t
2. Menj végig a Beállítási Varázslón
3. Amikor a CAT Vezérlésről kérdez, jelöld be az "Enable CAT Control" opciót
4. Írd be a `rigctld` értéket a rigctld útvonalként (mivel már a PATH-ban van)

### Linux Telepítés

#### 1. HamLedger Telepítése

##### A opció: Előre Lefordított Csomag Letöltése

1. Töltsd le a megfelelő csomagot a [Releases](https://github.com/valibali/hamledger/releases) oldalról:
   - `.deb` Ubuntu/Debian-hoz
   - `.rpm` Fedora/CentOS/RHEL-hez
   - `.AppImage` univerzális Linux-hoz

##### B opció: .deb Csomag Telepítése (Ubuntu/Debian)

```bash
sudo dpkg -i HamLedger_x.x.x_linux_x64.deb
sudo apt-get install -f  # Függőségi problémák javítása
```

##### C opció: .rpm Csomag Telepítése (Fedora/CentOS/RHEL)

```bash
sudo rpm -i HamLedger_x.x.x_linux_x64.rpm
```

##### D opció: AppImage Futtatása

```bash
chmod +x HamLedger_x.x.x_linux_x64.AppImage
./HamLedger_x.x.x_linux_x64.AppImage
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

#### 4. HamLedger Konfigurálása

1. Indítsd el a HamLedger-t
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
