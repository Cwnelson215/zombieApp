# zombieApp

```mermaid
sequenceDiagram
    User->>Game Select: Push join game button
    Game Select->>Nickname Select: Enter Game ID
    User->>Nickname Select: Clicked link with game code
    Nickname Select->>Nickname Select: Nickname in local storage
    Nickname Select->>Game: Enter Nickname
    Game->>Game: Play
    Game->> Game Select: Finished playing/Logout
```