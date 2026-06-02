Game description:

The game is about putting tree branches into a branch shredding machine. The initial screen the player sees is the background image and the following objects:
* A pile of branches to the lower left
* The branch shredding machine in the middle
* Two buckets to the lower right

In the upper right there is a small div showing the HUD (just hud.jpg, configurable width/height). If the player clicks the upper half of the HUD, the machine starts (with sound effect). If clicking the lower half, the machine stops (with sound effect). When the game first loads, an animated arrow is pointing at the upper half of the HUD so the player knows they should click it. After starting the machine, the arrow disappears permanently.

When the machine is started, it has a CSS animation so it looks like it's vibrating from its engine running. Use a minor rotation for this.

The pile of branches is randomly generated 20 branches. They get a random image of the 3 branch assets. They also have different sizes at random (unrelated to image): Small, medium, large. This affects their HTML element size.

The player can drag branches and feed them into the top of the machine (defined by a bounding box). When that is done, the branch become attached to the top of the machine (inside the machine div so it shares the vibrating animation). If the machine is stopped, then the branch just sits there. If the machine is running, it will consume and chop the branch. This looks like the branch is moving downwards, until it has moved downwards its full length. If a branch is halfway into the machine, only the upper half of the branch is visible (I think CSS masks can do this? The branch feeding hole is just slightly below the top of the machine asset image, so there is some overlap where the branch being chopped is visible in front of the machine). The machine may be stopped with a half-consumed branch in it, that then stops its downwards motion. Branches can be picked up while they are in the machine, this completely reverts the chopping process.

The downwards movement speed when being chopped is equally fast for branch sizes, but bigger branches take longer to chop. Use 3 configurable constants for how long each size is, which also defines the time it takes to chop it. When a branch is chopped, a chop sound is played. There is no limit to how many branches can be put into the machine at once. Each has its own independent downwards motion.

There is a risk (configurable percentage, initially 30%) that a branch gets stuck somewhere between 20% and 80% into the chopping process. When it gets stuck, it gets an additional animation to make it vibrate more violently (when the machine is running). The animation is anchored at the feeding hole on the top of the machine (at the same y-coordinate where below that coordinate the branch is not visible because it is inside the machine). When a branch gets stuck, the player must pick it up and put it back into the machine to restart the chopping process. It is restarted from the beginning and may get stuck multiple times.

The branches have a random rotation when lying on the ground. When placed into the machine, they transition smoothly into a vertical rotation, plus/minus 20 degrees. The vibration animation is in addition to this fixed rotation. When a stuck branch gets placed into the machine again, it gets a new random rotation.

The two buckets can be moved around by the player with drag and drop.

When a branch has been chopped, a wooden chip object is spawned from below the machine (visually, the asset looks like several chips but treat it as once object). If a bucket has been placed below the machine (defined by a bounding box), the wooden chip immediately lands inside the bucket. Otherwise it lands on the ground. The player can also drag and drop the chips, manually putting them in a bucket. Once a chip has been put into the bucket, it remains there indefinitely. Each bucket has a capacity of 10 chips. Together they can hold the 20 chips totally produced. If the bucket below the machine is full, the chip lands on the ground. The first chips attached to a bucket gets attached near the bottom, so it is visible how a bucket becomes gradually more filled up. The final chips almost overfills the bucket. Make these two settings configurable (first and last y-coordinate in bucket) and the x-coordinate inside the bucket is random.

There is a configurable y-coordinate threshold where objects can be draged and dropped, representing the ground (below this threshold). If an object is dropped above this threshold, it will fall down with an animation until it reaches the ground (a randomize y-coordiate below the threshold, excluding near the screen border). An exception to this is if branches are placed into the machine (its input feeding hole may be above the y-coordinate threshoold).

Assume that these assets exist:
Images in png format: background, machine_leg, machine_body, branch1, branch2, branch3, bucket_back, bucket_front, chips, hud
Sound in ogg format: machine_start, machine_stop, machine_run, chop_small, chop_medium, chop_large

Only one sound is playing at a time. All sound effects play once, except machine_run that is looping. When a sound finishes, machine_run starts looping again. The only exception is machine_stop, when that finishes there is silence. When a new sound is triggered, the current sound immediately stops.

Z-index is solved by giving each image a Z-index. The machine and bucket are special as they consists of two assets each. The assets machine_leg and machine_body have the same size and they have transparency. They will be placed at the same position in the machine div. Same idea for the bucket, so it can look like the chips are inside the bucket.

Z-order from furthest to nearest:
(background)
machine_leg
bucket_back
machine_body
chips in bucket
bucket_front
branches on ground
chips on ground

Use a game coordinate system where (0,0) is upper left and (100,100) is lower right. This is to make the web design responsive. Object locations are defined by their center coordinate. The machine is at (50,50) so it is at the middle of any screen size. Use local coordinate where appropriate, like the settings for chip placement filling inside a bucket.
