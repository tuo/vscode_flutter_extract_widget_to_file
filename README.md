# VSCode Extension: Flutter Extract Widget to File

As a Flutter developer, it's very common to refactor widgets into new files. The extension allows you to extract a selection of code into a stateless widget class, handling the import and file creation. This allows for smooth extraction without the need for a mouse.

Here is a simple Widget extraction when press "CMD/CTRL+ALT+E":

![alt text](https://media.giphy.com/media/N42B2VfGatYQOQLeiF/source.gif)


Here is another Widget extraction with properties specified:

![alt text](https://media.giphy.com/media/dKBYfFAick2uKVyYtN/source.gif)


## Usage

1. Open the Dart file you wish to modify within your Flutter project.
2. Choose the Widget you intend to transform into a new StatelessWidget.
3. Right-click on the selected text and opt for "Extract Flutter Widget to File," or use the shortcut "Cmd+Alt+E."
4. In the prompt that appears, provide a path relative to "lib," such as "components/tiles/MyWidget." The "MyWidget" will be camelcased, and the extension will generate a directory at "lib/components/tiles" along with a file named "my_widget.dart" within it.
5. Optionally, you may specify properties after the ";" to create fields within the newly created file.
6. Within the current file, the statement "import $packageName/components/tiles/my_widget.dart" will be appended to the import statements.
7. The selected widget will be replaced with "MyWidget()" along with its specified properties.

## Example

Below is an example of how to use the extension by selecting a Container Widget and converting it into a new StatelessWidget class named "MyNewWidget":

**main.dart (before)**
```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: const Text('My App')),
         body: ListView.builder(
          itemBuilder: (context, index) {
            final song = songs[index];
            return ListTile(
              title: Text(song.name),
              subtitle: Text(song.artistName),
              leading: CircleAvatar(
                backgroundImage: AssetImage(song.coverPath),
              ),
              trailing: Icon(Icons.delete),
              onTap: () => goToSongPage(index),
            );
          },
          itemCount: songs.length,
        ),
      ),     
    );
  }
}
```

press `Cmd+Atl+E`, in the prompt box, typing: `components/tiles/MyTile;Song song,void Function()? onTap`, will generate:

**main.dart (after)**
```dart
import 'package:flutter/material.dart';
import "package:hello_world_app/components/tiles/my_tile.dart"; //this will automatically inserted

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: const Text('My App')),
        body: ListView.builder(
         itemBuilder: (context, index) {
            final song = songs[index];
            return MyTile(
              song: null, //Here just assgin variable
              onTap: null, //Here assign the handler
            );
          },
          itemCount: songs.length,
        ),
      ),     
    );
  }
}
```



**lib/components/tiles/my_tile.dart**
```dart
import 'package:flutter/material.dart';
import 'package:hello_world_app/models/song.dart';

class MyTile extends StatelessWidget {
  final Song song;
  final void Function()? onTap;

  const MyTile({super.key, required this.song, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text(song.name),
      subtitle: Text(song.artistName),
      leading: CircleAvatar(
        backgroundImage: AssetImage(song.coverPath),
      ),
      trailing: Icon(Icons.delete),
      onTap: onTap,
    );
  }
}

```


Inspired by [Flutter Extract Widget and Create Part](https://github.com/alper-mf/vscode_flutter_extract_widget_create_part) and [VSCode Advanced New File](https://github.com/patbenatar/vscode-advanced-new-file/tree/master?tab=readme-ov-file#vscode-advanced-new-file).



[publisher](https://marketplace.visualstudio.com/manage/publishers/tuohuang)